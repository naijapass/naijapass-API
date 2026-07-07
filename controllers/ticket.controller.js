const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const Event = require('../models/event');
const Ticket = require('../models/ticket');
const QRCode = require('qrcode');
const crypto = require('crypto');
const r2 = require('../utils/cloud.r2.bucket');
const { sendTicketEmail, sendOrganizerTicketSoldEmail } = require('../services/email.service');
const User = require('../models/user');
const axios = require('axios');

// Upload QR code to R2 and return public URL
const uploadQRCodeToR2 = async (ticketCode, eventTitle, buyerName) => {
  // Generate QR code as buffer
  const qrBuffer = await QRCode.toBuffer(ticketCode, {
    width: 300,
    margin: 2,
    color: {
      dark: '#023020',
      light: '#FFFFFF'
    }
  });

  // Sanitize filename
  const sanitizedTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const sanitizedName = buyerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const fileName = `tickets/${sanitizedTitle}/${sanitizedName}-${ticketCode}-${Date.now()}.png`;

  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: qrBuffer,
    ContentType: 'image/png',
    ACL: 'public-read'
  };

  await r2.upload(params).promise();

  // Return public URL
  return `${process.env.R2_PUBLIC_URL_BASE}/${fileName}`;
};

const verifyPaystackPayment = async (reference) => {
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Paystack verification error:', error.message);
    return null;
  }
};
// Generate unique ticket code
const generateTicketCode = () => {
  return `TKT-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
};

// Create ticket and send email - SINGLE ROUTE
const createTicketAndSendEmail = catchAsync(async (req, res) => {
  const {
    eventId,
    ticketTierId,
    attendees,
    paymentReference: requestPaymentReference,
    amount
  } = req.body;

  let paymentReference = requestPaymentReference;

  // ============ STEP 1: VERIFY PAYMENT WITH PAYSTACK (SKIP FOR FREE) ============
  const isFreeTicket = amount === 0;
  
  if (!isFreeTicket) {
    console.log(` Verifying payment with reference: ${paymentReference}`);
    
    const verification = await verifyPaystackPayment(paymentReference);
    
    if (!verification || !verification.status) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: false,
        message: 'Payment verification failed. Please try again.'
      });
    }
    
    if (verification.data.status !== 'success') {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: false,
        message: `Payment not successful. Status: ${verification.data.status}`
      });
    }
    
    const paidAmount = verification.data.amount / 100;
    if (paidAmount !== amount) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: false,
        message: 'Payment amount mismatch. Please contact support.'
      });
    }
    
    const existingTicket = await Ticket.findOne({ paymentReference });
    if (existingTicket) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: false,
        message: 'This payment reference has already been used.'
      });
    }
  } else {
    console.log(`Free ticket - skipping payment verification`);
    // Generate a reference for free tickets if not provided
    if (!paymentReference) {
      paymentReference = `FREE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  // ============ STEP 2: PROCEED WITH TICKET CREATION ============
  const event = await Event.findById(eventId);
  if (!event) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: false,
      message: 'Event not found'
    });
  }

  const tier = event.ticketTiers.id(ticketTierId);
  if (!tier) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Ticket tier not found'
    });
  }

  const quantity = attendees.length;
  const available = tier.quantity - tier.sold;
  if (available < quantity) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Not enough tickets available'
    });
  }

  // Calculate amounts: For free tickets, no fee
  const organizerPrice = tier.price; // What organizer earns (0 for free tickets)
  const platformFee = isFreeTicket ? 0 : Math.ceil(organizerPrice * 0.08);
  const customerPrice = organizerPrice + platformFee;
  const totalOrganizerEarnings = organizerPrice * quantity;

  const createdTickets = [];
  const organizer = await User.findById(event.organizer);

  // Create tickets for EACH attendee
  for (let i = 0; i < quantity; i++) {
    const attendee = attendees[i];
    const ticketCode = generateTicketCode();

    const qrCodeUrl = await uploadQRCodeToR2(ticketCode, event.title, attendee.fullName);
    const qrCodeDataUrl = await QRCode.toDataURL(ticketCode, {
      width: 300,
      margin: 2,
      color: { dark: '#023020', light: '#FFFFFF' }
    });

    const ticket = await Ticket.create({
      event: event._id,
      eventTitle: event.title,
      eventDate: event.startDate,
      eventTime: `${event.startTime} - ${event.endTime}`,
      eventVenue: event.venue,
      eventAddress: event.address,
      eventCity: event.city,
      eventBannerImage: event.bannerImage,
      organizerName: event.organizerName,
      organizerPhone: event.organizerPhone,
      organizerEmail: event.organizerEmail,
      ticketTierName: tier.name,
      ticketPrice: organizerPrice,
      customerPrice: isFreeTicket ? 0 : customerPrice,
      platformFee: platformFee,
      buyerName: attendee.fullName,
      buyerEmail: attendee.email,
      buyerPhone: attendee.phone,
      matriculationNumber: attendee.matriculationNumber || '',
      quantity: 1,
      totalAmount: organizerPrice,
      ticketCode,
      qrCodeDataUrl: qrCodeDataUrl,
      qrCodeUrl: qrCodeUrl,
      paymentReference,
      paymentStatus: isFreeTicket ? 'free' : 'success',
    });

    createdTickets.push(ticket);

    const formattedDate = new Date(event.startDate).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });

    const eventLink = `${process.env.FRONTEND_URL}/buy-ticket/${event.shareId}`;

    // Send email to attendee (buyer)
    const ticketData = {
      name: attendee.fullName,
      eventTitle: event.title,
      eventCategory: event.category,
      eventDate: formattedDate,
      eventTime: `${event.startTime} - ${event.endTime}`,
      eventVenue: event.venue,
      eventAddress: event.address,
      eventCity: event.city,
      eventBannerImage: event.bannerImage,
      organizerName: event.organizerName,
      organizerPhone: event.organizerPhone,
      organizerEmail: event.organizerEmail,
      ticketType: tier.name,
      quantity: 1,
      ticketPrice: isFreeTicket ? 'FREE' : `₦${customerPrice.toLocaleString()}`,
      ticketCode: ticketCode,
      matriculationNumber: attendee.matriculationNumber || '',
      qrCodeImage: qrCodeUrl,
      eventLink
    };

    await sendTicketEmail(attendee.email, ticketData);
    console.log(` Ticket sent to attendee: ${attendee.fullName} at ${attendee.email}`);

    // Send notification to organizer
    if (organizer && organizer.email) {
      const organizerData = {
        organizerName: organizer.fullName,
        eventTitle: event.title,
        eventDate: formattedDate,
        eventTime: `${event.startTime} - ${event.endTime}`,
        eventVenue: event.venue,
        eventCity: event.city,
        buyerName: attendee.fullName,
        buyerEmail: attendee.email,
        buyerPhone: attendee.phone,
        ticketType: tier.name,
        quantity: 1,
        ticketCode: ticketCode,
        ticketPrice: isFreeTicket ? 0 : organizerPrice,
        platformFee: platformFee,
        customerPaid: isFreeTicket ? 0 : customerPrice,
        organizerEarnings: organizerPrice,
        dashboardUrl: `${process.env.FRONTEND_URL}/organizer/dashboard`,
      };
      
      await sendOrganizerTicketSoldEmail(organizer.email, organizerData);
      console.log(` Notification sent to organizer: ${organizer.fullName} at ${organizer.email}`);
    }
  }

  // Update event ticket sales
  tier.sold += quantity;
  event.ticketsSold += quantity;
  event.revenue += totalOrganizerEarnings;
  await event.save();

  // Update organizer's wallet (only if paid tickets)
  if (organizer && totalOrganizerEarnings > 0) {
    organizer.wallet.balance = (organizer.wallet.balance || 0) + totalOrganizerEarnings;
    organizer.wallet.availableBalance = (organizer.wallet.availableBalance || 0) + totalOrganizerEarnings;
    organizer.wallet.totalEarned = (organizer.wallet.totalEarned || 0) + totalOrganizerEarnings;
    
    organizer.totalTicketsSold = (organizer.totalTicketsSold || 0) + quantity;
    organizer.totalRevenue = (organizer.totalRevenue || 0) + totalOrganizerEarnings;
    
    await organizer.save();
    
    console.log(` Organizer ${organizer.fullName} wallet credited: ₦${totalOrganizerEarnings} for ${quantity} tickets`);
  }

  res.status(httpStatus.CREATED).json({
    status: true,
    message: `${quantity} ticket(s) created and sent to attendees`,
    data: {
      tickets: createdTickets.map(t => ({
        id: t._id,
        ticketCode: t.ticketCode,
        qrCodeUrl: t.qrCodeUrl,
        attendeeName: t.buyerName,
        matriculationNumber: t.matriculationNumber
      })),
      payment: isFreeTicket ? null : {
        reference: paymentReference,
        amount: amount,
        status: 'verified'
      },
      event: {
        title: event.title,
        venue: event.venue,
        address: `${event.address}, ${event.city}`
      }
    }
  });
});

// Check in attendee (scan QR code) - done by event organizer
const checkInAttendee = catchAsync(async (req, res) => {
  const { ticketCode } = req.params;
  const { organizerId } = req.body;

  // Find ticket
  const ticket = await Ticket.findOne({ ticketCode, paymentStatus: 'success' });
  if (!ticket) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: false,
      message: 'Invalid ticket code'
    });
  }

  // Check if already checked in
  if (ticket.checkedIn) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: `Ticket already checked in at ${new Date(ticket.checkedInAt).toLocaleString()}`
    });
  }

  // Check if event has expired
  const event = await Event.findById(ticket.event);
  if (new Date(event.endDate) < new Date()) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Event has already ended'
    });
  }

  // Update ticket
  ticket.checkedIn = true;
  ticket.checkedInAt = new Date();
  ticket.checkedInBy = organizerId;
  await ticket.save();

  res.status(httpStatus.OK).json({
    status: true,
    message: 'Checked in successfully',
    data: {
      attendeeName: ticket.buyerName,
      ticketCode: ticket.ticketCode,
      eventTitle: ticket.eventTitle,
      checkedInAt: ticket.checkedInAt
    }
  });
});

// Get ticket by ID
const getTicket = catchAsync(async (req, res) => {
  const { ticketId } = req.params;

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: false,
      message: 'Ticket not found'
    });
  }

  res.status(httpStatus.OK).json({
    status: true,
    data: ticket
  });
});





const getEventTickets = catchAsync(async (req, res) => {
  const { eventId } = req.params;

  // Verify event exists and belongs to the logged-in organizer
  const event = await Event.findOne({ _id: eventId, organizer: req.user.id });
  if (!event) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: false,
      message: 'Event not found or you don\'t have permission'
    });
  }

  // Get all tickets for this event
  const tickets = await Ticket.find({ event: eventId }).sort({ purchaseDate: -1 });

  // Calculate statistics
  const stats = {
    totalTicketsSold: tickets.length,
    checkedInCount: tickets.filter(t => t.checkedIn === true).length,
    pendingCheckInCount: tickets.filter(t => t.checkedIn === false).length,
    totalRevenue: tickets.reduce((sum, t) => sum + t.totalAmount, 0)
  };

  // Group tickets by status
  const checkedInTickets = tickets.filter(t => t.checkedIn === true);
  const pendingTickets = tickets.filter(t => t.checkedIn === false);

  res.status(httpStatus.OK).json({
    status: true,
    data: {
      event: {
        id: event._id,
        title: event.title,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        venue: event.venue,
        city: event.city,
        bannerImage: event.bannerImage
      },
      stats,
      tickets: {
        all: tickets,
        checkedIn: checkedInTickets,
        pending: pendingTickets
      }
    }
  });
});

const checkInTicket = catchAsync(async (req, res) => {
  const { ticketCode } = req.params;
  const { eventId } = req.body;

  // Verify event exists and belongs to the logged-in organizer
  const event = await Event.findOne({ _id: eventId, organizer: req.user.id });
  if (!event) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: false,
      message: 'Event not found or you don\'t have permission'
    });
  }

  // Find the ticket
  const ticket = await Ticket.findOne({ ticketCode, event: eventId });
  if (!ticket) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: false,
      message: 'Invalid ticket code or ticket not found for this event'
    });
  }

  // Check if ticket is already checked in
  if (ticket.checkedIn) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Ticket already checked in',
      data: {
        checkedInAt: ticket.checkedInAt,
        buyerName: ticket.buyerName,
        ticketType: ticket.ticketTierName
      }
    });
  }

  const now = new Date();
  const eventEndDate = new Date(event.endDate);
  eventEndDate.setHours(23, 59, 59, 999);

  // Calculate check-in start time (2 hours before event)
  let checkInStartTime;
  if (event.startTime && event.startTime !== '') {
    const [hours, minutes] = event.startTime.split(':');
    const eventDateTime = new Date(event.startDate);
    eventDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
    checkInStartTime = new Date(eventDateTime);
    checkInStartTime.setHours(eventDateTime.getHours() - 2);
  } else {
    const eventStartDate = new Date(event.startDate);
    checkInStartTime = new Date(eventStartDate);
    checkInStartTime.setHours(eventStartDate.getHours() - 2);
  }

  // Check if check-in is too early (more than 2 hours before event)
  if (now < checkInStartTime) {
    const hoursUntilCheckIn = Math.ceil((checkInStartTime.getTime() - now.getTime()) / (1000 * 60 * 60));
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: `Check-in not available yet. Check-in starts 2 hours before the event.`,
      data: {
        checkInAvailableFrom: checkInStartTime,
        hoursUntilCheckIn,
        eventStartTime: event.startTime,
        eventDate: event.startDate
      }
    });
  }

  // Check if event has ended
  if (now > eventEndDate) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Event has ended. Ticket expired.',
      data: {
        eventEndDate,
        ticketCode: ticket.ticketCode
      }
    });
  }

  // Check-in the ticket
  ticket.checkedIn = true;
  ticket.checkedInAt = new Date();
  ticket.checkedInBy = req.user.id;
  await ticket.save();

  // Get organizer info who checked in
  const organizer = await User.findById(req.user.id).select('name email');

  res.status(httpStatus.OK).json({
    status: true,
    message: 'Ticket checked in successfully',
    data: {
      ticket: {
        id: ticket._id,
        ticketCode: ticket.ticketCode,
        buyerName: ticket.buyerName,
        buyerEmail: ticket.buyerEmail,
        buyerPhone: ticket.buyerPhone,
        ticketType: ticket.ticketTierName,
        ticketPrice: ticket.ticketPrice,
        checkedInAt: ticket.checkedInAt,
        checkedInBy: {
          id: organizer._id,
          name: organizer.name
        }
      },
      event: {
        id: event._id,
        title: event.title,
        venue: event.venue,
        city: event.city
      }
    }
  });
});

module.exports = {
  createTicketAndSendEmail,
  checkInAttendee,
  getTicket,
  checkInTicket,
  getEventTickets
};