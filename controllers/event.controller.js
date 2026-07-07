// controllers/event.controller.js
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const Event = require('../models/event');
const QRCode = require('qrcode');
const r2 = require('../utils/cloud.r2.bucket')
const crypto = require('crypto');





const uploadToR2 = async (file) => {
  const fileExtension = file.originalname.split('.').pop();
  const fileName = `events/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;

  const params = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  await r2.upload(params).promise();

  // Use the base public URL from env
  const publicUrl = `${process.env.R2_PUBLIC_URL_BASE}/${fileName}`;

  return publicUrl;
};

const createEvent = catchAsync(async (req, res) => {
  let eventData;

  if (req.body.eventData) {
    eventData = JSON.parse(req.body.eventData);
  } else {
    eventData = {
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      venue: req.body.venue,
      address: req.body.address,
      city: req.body.city,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      organizerName: req.body.organizerName,
      organizerEmail: req.body.organizerEmail,
      organizerPhone: req.body.organizerPhone,
      collectMatriculationNumber: req.body.collectMatriculationNumber === 'true' || req.body.collectMatriculationNumber === true,
      ticketTiers: typeof req.body.ticketTiers === 'string' ? JSON.parse(req.body.ticketTiers) : req.body.ticketTiers,
      faq: req.body.faq ? (typeof req.body.faq === 'string' ? JSON.parse(req.body.faq) : req.body.faq) : []
    };
  }

  let bannerImage = '';
  if (req.file) {
    bannerImage = await uploadToR2(req.file);
  } else if (req.files && req.files.image) {
    bannerImage = await uploadToR2(req.files.image[0]);
  }

  // Calculate platform fee (8% for paid tickets, 0 for free tickets)
  if (eventData.ticketTiers && eventData.ticketTiers.length > 0) {
    eventData.ticketTiers = eventData.ticketTiers.map(tier => {
      const organizerPrice = tier.price; // What organizer earns
      let platformFee = 0;
      let customerPrice = organizerPrice;

      // Only charge 8% fee if ticket is NOT free (price > 0)
      if (organizerPrice > 0) {
        platformFee = Math.ceil(organizerPrice * 0.08); // 8% fee, rounded up
        customerPrice = organizerPrice + platformFee; // What customer pays
      }
      // Free tickets (price = 0) have 0% fee

      return {
        ...tier,
        organizerPrice: organizerPrice,  // What organizer earns
        platformFee: platformFee,        // 8% or 0 for free
        customerPrice: customerPrice,    // What customer pays (organizerPrice + fee)
        price: customerPrice,            // Store customer price for display
        quantity: tier.quantity,
        sold: tier.sold || 0
      };
    });
    eventData.totalTickets = eventData.ticketTiers.reduce((sum, tier) => sum + tier.quantity, 0);
  }

  // Create the event first to get the _id
  const event = await Event.create({
    ...eventData,
    bannerImage,
    organizer: req.user.id
  });

  // Set shareId to be the same as event._id
  event.shareId = event._id.toString();

  // Generate and save shareUrl
  event.shareUrl = `${process.env.FRONTEND_URL}/buy-ticket/${event.shareId}`;

  // Generate and save QR code
  const qrCodeDataUrl = await QRCode.toDataURL(event.shareUrl, {
    width: 200,
    margin: 2,
    color: {
      dark: '#023020',
      light: '#FFFFFF'
    }
  });
  event.qrCodeDataUrl = qrCodeDataUrl;

  await event.save();

  res.status(httpStatus.CREATED).json({
    status: true,
    message: 'Event created successfully',
    data: {
      event,
      shareUrl: event.shareUrl,
      qrCode: event.qrCodeDataUrl
    }
  });
});

// Get all events for logged-in organizer
const getMyEvents = catchAsync(async (req, res) => {
  const events = await Event.find({ organizer: req.user.id }).sort({ createdAt: -1 });

  res.status(httpStatus.OK).json({
    status: true,
    data: events
  });
});

// Get single event by ID (owner)
const getEventById = catchAsync(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findOne({ _id: eventId, organizer: req.user.id });

  if (!event) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: false,
      message: 'Event not found'
    });
  }

  res.status(httpStatus.OK).json({
    status: true,
    data: {
      event,
      shareUrl: event.shareUrl,
      qrCode: event.qrCodeDataUrl
    }
  });
});

// Get event by shareId (public - anyone can view)
const getEventByShareId = catchAsync(async (req, res) => {
  const { shareId } = req.params;

  const event = await Event.findOne({ shareId, status: 'published' });

  if (!event) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: false,
      message: 'Event not found'
    });
  }

  res.status(httpStatus.OK).json({
    status: true,
    data: {
      _id: event._id,
      id: event._id,
      title: event.title,
      category: event.category,
      description: event.description,
      venue: event.venue,
      address: event.address,
      city: event.city,
      startDate: event.startDate,
      endDate: event.endDate,
      startTime: event.startTime,
      endTime: event.endTime,
      bannerImage: event.bannerImage,
      organizerName: event.organizerName,
      collectMatriculationNumber: event.collectMatriculationNumber,
      ticketTiers: event.ticketTiers,
      faq: event.faq,
      organizerEmail: event.organizerEmail,
      organizerPhone: event.organizerPhone,
      likeCount: event.likeCount,
      shareUrl: event.shareUrl,
      qrCodeDataUrl: event.qrCodeDataUrl
    }
  });
});

// Update event
const updateEvent = catchAsync(async (req, res) => {
  const { eventId } = req.params;

  // Check if update has file or JSON data
  let updates;
  let bannerImage;

  if (req.file) {
    updates = JSON.parse(req.body.eventData);
    bannerImage = await uploadToR2(req.file);
    updates.bannerImage = bannerImage;
  } else {
    updates = req.body;
  }

  // Get the existing event to compare prices
  const existingEvent = await Event.findOne({ _id: eventId, organizer: req.user.id });

  if (!existingEvent) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: false,
      message: 'Event not found'
    });
  }

  // Calculate platform fee (8% for paid tickets, 0 for free tickets) - ONLY IF PRICE CHANGED
  if (updates.ticketTiers && updates.ticketTiers.length > 0) {
    updates.ticketTiers = updates.ticketTiers.map((newTier) => {
      // Find existing tier by ID or name (fallback to name)
      const existingTier = existingEvent.ticketTiers.find(
        (tier) => tier._id?.toString() === newTier._id?.toString() || tier.name === newTier.name
      );

      // Check if price has changed or if it's a new tier
      const priceChanged = !existingTier || (existingTier && existingTier.price !== newTier.price);
      
      // Get the original organizer price (if exists)
      const existingOrganizerPrice = existingTier?.organizerPrice || existingTier?.price || newTier.price;
      
      // Only recalculate if price changed
      let organizerPrice = newTier.price;
      let platformFee = existingTier?.platformFee || 0;
      let customerPrice = existingTier?.customerPrice || newTier.price;
      
      if (priceChanged) {
        organizerPrice = newTier.price;
        
        // Only charge 8% fee if ticket is NOT free (price > 0)
        if (organizerPrice > 0) {
          platformFee = Math.ceil(organizerPrice * 0.08); // 8% fee, rounded up
          customerPrice = organizerPrice + platformFee; // What customer pays
        } else {
          // Free ticket
          platformFee = 0;
          customerPrice = 0;
        }
      }
      
      return {
        ...newTier,
        organizerPrice: organizerPrice,  // What organizer earns
        platformFee: platformFee,        // 8% or 0 for free
        customerPrice: customerPrice,    // What customer pays
        price: customerPrice,            // Store customer price for display
        quantity: newTier.quantity,
        sold: newTier.sold || existingTier?.sold || 0
      };
    });
  }

  const event = await Event.findOneAndUpdate(
    { _id: eventId, organizer: req.user.id },
    updates,
    { new: true }
  );

  res.status(httpStatus.OK).json({
    status: true,
    message: 'Event updated successfully',
    data: event
  });
});

// Delete event
const deleteEvent = catchAsync(async (req, res) => {
  const { eventId } = req.params;

  const event = await Event.findOne({ _id: eventId, organizer: req.user.id });

  if (!event) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: false,
      message: 'Event not found'
    });
  }

  // 1. Check if tickets have been sold
  if (event.ticketsSold > 0) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: `Cannot delete event. ${event.ticketsSold} ticket(s) have already been sold. Contact support for assistance.`
    });
  }

  // 2. Check if event has any pending/upcoming status
  if (event.status === 'published') {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Cannot delete a published event. Please cancel it first.'
    });
  }

  // 3. Check if event has already passed
  if (new Date(event.endDate) < new Date()) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Cannot delete an event that has already ended.'
    });
  }

  await event.deleteOne();

  res.status(httpStatus.OK).json({
    status: true,
    message: 'Event deleted successfully'
  });
});

// Like/unlike event - ANYONE can like, no login required
const toggleLike = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { visitorId } = req.body;

  if (!visitorId) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Visitor ID is required'
    });
  }

  const event = await Event.findById(eventId);

  if (!event) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: false,
      message: 'Event not found'
    });
  }

  const hasLiked = event.likes.includes(visitorId);

  if (hasLiked) {
    // Unlike
    event.likes = event.likes.filter(id => id !== visitorId);
    event.likeCount = event.likes.length;
  } else {
    // Like
    event.likes.push(visitorId);
    event.likeCount = event.likes.length;
  }

  await event.save();

  res.status(httpStatus.OK).json({
    status: true,
    message: hasLiked ? 'Event unliked' : 'Event liked',
    data: { likeCount: event.likeCount, hasLiked: !hasLiked }
  });
});

// Get like status for an event
const getLikeStatus = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { visitorId } = req.query;

  const event = await Event.findById(eventId);

  if (!event) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: false,
      message: 'Event not found'
    });
  }

  const hasLiked = visitorId ? event.likes.includes(visitorId) : false;

  res.status(httpStatus.OK).json({
    status: true,
    data: {
      likeCount: event.likeCount,
      hasLiked
    }
  });
});

// Get all published events (for browsing)
const getPublishedEvents = catchAsync(async (req, res) => {
  const { category, city, search, soldOut } = req.query;

  let query = { status: 'published' };

  if (category && category !== 'all') {
    query.category = category;
  }

  if (city && city !== 'all') {
    query.city = city;
  }

  let events = await Event.find(query).sort({ startDate: 1 });

  if (search) {
    events = events.filter(event =>
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.venue.toLowerCase().includes(search.toLowerCase()) ||
      event.city.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Calculate total available tickets and add isSoldOut flag
  events = events.map(event => {
    const eventObj = event.toObject();
    const totalAvailable = event.ticketTiers.reduce((sum, tier) => sum + (tier.quantity - tier.sold), 0);
    eventObj.isSoldOut = totalAvailable === 0;
    return eventObj;
  });

  // Filter by sold out status if requested
  if (soldOut === 'true') {
    events = events.filter(event => event.isSoldOut === true);
  } else if (soldOut === 'false') {
    events = events.filter(event => event.isSoldOut === false);
  }

  res.status(httpStatus.OK).json({
    status: true,
    data: events
  });
});

const cancelEvent = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const event = await Event.findOne({ _id: eventId, organizer: req.user.id });

  if (!event) {
    return res.status(httpStatus.NOT_FOUND).json({
      status: false,
      message: 'Event not found'
    });
  }

  // CRITICAL: Check if any tickets were sold
  if (event.ticketsSold > 0) {
    return res.status(httpStatus.BAD_REQUEST).json({
      status: false,
      message: 'Cannot cancel event. Tickets have already been sold. Please contact support for assistance.'
    });
  }

  // Only allow cancellation if NO tickets sold
  event.status = 'cancelled';
  await event.save();

  res.status(httpStatus.OK).json({
    status: true,
    message: 'Event cancelled successfully'
  });
});

module.exports = {
  createEvent,
  getMyEvents,
  getEventById,
  getEventByShareId,
  updateEvent,
  deleteEvent,
  toggleLike,
  getLikeStatus,
  getPublishedEvents,
  cancelEvent
};