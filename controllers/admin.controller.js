// controllers/admin.controller.js
const bcrypt = require("bcryptjs");
const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const Admin = require("../models/admin");
const { authService, tokenService } = require('../services');
const Event = require("../models/event");
const Ticket = require("../models/ticket");
const User = require("../models/user");


exports.bootstrapSuperadmin = catchAsync(async (req, res) => {
  const { fullname, email, password, phoneNumber } = req.body;

  // Check if a superadmin already exists
  const existingSuperadmin = await Admin.findOne({ role: "superadmin" });
  if (existingSuperadmin) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Superadmin already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const superadmin = await Admin.create({
    fullname,
    email,
    password: hashedPassword,
    phoneNumber,
    role: "superadmin",
    permissions: ["*"],
  });

  return res.status(httpStatus.CREATED).json({
    message: "Superadmin created successfully",
    superadmin: {
      id: superadmin._id,
      fullname: superadmin.fullname,
      email: superadmin.email,
      role: superadmin.role,
    },
  });
});

// Create new admin (Superadmin only)
exports.createAdmin = catchAsync(async (req, res) => {
  const { fullname, email, password, phoneNumber, role, permissions, ProfilePicture } = req.body;

  // Ensure only superadmin can create accounts
  if (req.user.role !== "superadmin") {
    return res
      .status(httpStatus.FORBIDDEN)
      .json({ message: "Only superadmin can create new admins" });
  }


  // Check if trying to create another superadmin
  if (role === "superadmin") {
    const existingSuperadmin = await Admin.findOne({ role: "superadmin" });
    if (existingSuperadmin) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ message: "Only one superadmin is allowed" });
    }
  }

  // Validate role
  if (!["superadmin", "moderator", "support"].includes(role)) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Invalid role. Allowed: superadmin, moderator, support" });
  }

  // Check if email already exists
  const existing = await Admin.findOne({ email });
  if (existing) {
    return res
      .status(httpStatus.CONFLICT)
      .json({ message: "Email already registered" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await Admin.create({
    fullname,
    email,
    password: hashedPassword,
    phoneNumber,
    role,
    ProfilePicture,
    permissions: req.user.role === "superadmin" ? (permissions || []) : [],
  });

  return res.status(httpStatus.CREATED).json({
    message: "Admin created successfully",
    admin: {
      id: admin._id,
      fullname: admin.fullname,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions,
    },
  });
});

// Login admin
exports.loginAdmin = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin) {
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json({ message: "Invalid credentials" });
  }

  const validPassword = await bcrypt.compare(password, admin.password);
  if (!validPassword) {
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json({ message: "Invalid credentials" });
  }

  // Update last login
  admin.lastLogin = new Date();
  await admin.save();

  // Use same token flow as customers
    const tokens = await tokenService.generateAuthTokens({
      _id: admin._id.toString(),
      role: admin.role,
      permissions: admin.permissions,
      actor: "admin",
    });

    return res.json({
      message: "Login successful",
      tokens,
      admin: {
        id: admin._id,
        fullname: admin.fullname,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        profilePicture: admin.profilePicture || "",
        isOnline: false,
        lastLogin: admin.lastLogin,
      },
    });
  });

  exports.getOnlineAdmins = catchAsync(async (req, res) => {
    const onlineAdmins = await Admin.find({ isOnline: true }).select("-password");

    return res.status(httpStatus.OK).json({
      count: onlineAdmins.length,
      admins: onlineAdmins,
    });
  });


  // Logout admin

  exports.logoutAdmin = catchAsync(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    res.status(httpStatus.NO_CONTENT).send();
  });

  exports.refreshTokens = catchAsync(async (req, res) => {
    const tokens = await authService.refreshAuth(req.body.refreshToken, req.body.actor);
    res.send({ ...tokens });
  });


  exports.getDashboardStats = catchAsync(async (req, res) => {
    console.log(await Event.countDocuments());
console.log(await Ticket.countDocuments());
console.log(await User.countDocuments());
    try {
      // Get all stats in parallel for better performance
      const [
        events,
        tickets,
        organizers,
      ] = await Promise.all([
        // Event Stats
        Event.aggregate([
          {
            $group: {
              _id: null,
              totalEvents: { $sum: 1 },
              publishedEvents: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
              draftEvents: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
              cancelledEvents: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
              completedEvents: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
              expiredEvents: { $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] } }
            }
          }
        ]),

        // Ticket Stats
        Ticket.aggregate([
          {
            $group: {
              _id: null,
              totalTicketsSold: { $sum: '$quantity' },
              totalRevenue: { $sum: '$totalAmount' }
            }
          }
        ]),

        // Organizer Stats (Users who have created events)
        User.aggregate([
          {
            $match: {
              events: { $exists: true, $ne: [] }
            }
          },
          {
            $group: {
              _id: null,
              totalOrganizers: { $sum: 1 }
            }
          }
        ]),
      ]);

      // Get active organizers (those with published events)
      const activeOrganizers = await User.aggregate([
        {
          $match: {
            events: { $exists: true, $ne: [] }
          }
        },
        {
          $lookup: {
            from: 'events',
            localField: 'events',
            foreignField: '_id',
            as: 'eventDetails'
          }
        },
        {
          $match: {
            'eventDetails.status': 'published'
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 }
          }
        }
      ]);

      // Get total customers (distinct buyers)
      const totalCustomers = await Ticket.distinct('buyerEmail');

      // Prepare response - only fields used by frontend
      const dashboardStats = {
        totalEvents: events[0]?.totalEvents || 0,
        publishedEvents: events[0]?.publishedEvents || 0,
        draftEvents: events[0]?.draftEvents || 0,
        cancelledEvents: events[0]?.cancelledEvents || 0,
        completedEvents: events[0]?.completedEvents || 0,
        expiredEvents: events[0]?.expiredEvents || 0,
        totalTicketsSold: tickets[0]?.totalTicketsSold || 0,
        totalRevenue: tickets[0]?.totalRevenue || 0,
        totalOrganizers: organizers[0]?.totalOrganizers || 0,
        activeOrganizers: activeOrganizers[0]?.count || 0,
        totalCustomers: totalCustomers.length || 0,
      };

      res.status(httpStatus.OK).json({
        success: true,
        data: dashboardStats
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to fetch dashboard statistics',
        error: error.message
      });
    }
  });

  // ============ MISSING ROUTE HANDLERS ============

// 1. GET all events with pagination and filters
exports.getEvents = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;
  
  const query = {};
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { organizerName: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  
  const [events, total] = await Promise.all([
    Event.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('organizer', 'fullName email'),
    Event.countDocuments(query)
  ]);

  res.status(httpStatus.OK).json({
    success: true,
    data: {
      data: events,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  });
});

// 2. GET single event by ID
exports.getEventById = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const event = await Event.findById(id)
    .populate('organizer', 'fullName email phoneNumber');
  
  if (!event) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'Event not found'
    });
  }

  res.status(httpStatus.OK).json({
    success: true,
    data: event
  });
});

// 3. PATCH update event status
exports.updateEventStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['draft', 'published', 'cancelled', 'completed', 'expired'];
  if (!validStatuses.includes(status)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Invalid status'
    });
  }

  const event = await Event.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );

  if (!event) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'Event not found'
    });
  }

  res.status(httpStatus.OK).json({
    success: true,
    data: event
  });
});

// 4. DELETE event
exports.deleteEvent = catchAsync(async (req, res) => {
  const { id } = req.params;

  const event = await Event.findById(id);
  if (!event) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'Event not found'
    });
  }

  // Delete all tickets for this event
  await Ticket.deleteMany({ event: id });
  
  // Delete the event
  await event.deleteOne();

  res.status(httpStatus.OK).json({
    success: true,
    message: 'Event deleted successfully'
  });
});

// 5. GET all tickets with pagination and filters
exports.getTickets = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status, eventId, search } = req.query;
  
  const query = {};
  if (status) query.paymentStatus = status;
  if (eventId) query.event = eventId;
  if (search) {
    query.$or = [
      { ticketCode: { $regex: search, $options: 'i' } },
      { buyerName: { $regex: search, $options: 'i' } },
      { buyerEmail: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  
  const [tickets, total] = await Promise.all([
    Ticket.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('event', 'title startDate'),
    Ticket.countDocuments(query)
  ]);

  res.status(httpStatus.OK).json({
    success: true,
    data: {
      data: tickets,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  });
});

// 6. GET single ticket by ID
exports.getTicketById = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const ticket = await Ticket.findById(id)
    .populate('event', 'title startDate venue')
    .populate('checkedInBy', 'fullName email');
  
  if (!ticket) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  res.status(httpStatus.OK).json({
    success: true,
    data: ticket
  });
});

// 7. PATCH update ticket status
exports.updateTicketStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'success', 'failed', 'free'];
  if (!validStatuses.includes(status)) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Invalid status'
    });
  }

  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { paymentStatus: status },
    { new: true }
  );

  if (!ticket) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'Ticket not found'
    });
  }

  res.status(httpStatus.OK).json({
    success: true,
    data: ticket
  });
});

// 8. GET all users with pagination and search
exports.getUsers = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  
  const query = {};
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (page - 1) * limit;
  
  const [users, total] = await Promise.all([
    User.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .select('-password'),
    User.countDocuments(query)
  ]);

  res.status(httpStatus.OK).json({
    success: true,
    data: {
      data: users,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    }
  });
});

// 9. GET single user by ID
exports.getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const user = await User.findById(id)
    .select('-password')
    .populate('events', 'title startDate status');
  
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(httpStatus.OK).json({
    success: true,
    data: user
  });
});

// 10. PATCH update user ban status
exports.updateUserBan = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { isBanned } = req.body;

  const user = await User.findByIdAndUpdate(
    id,
    { isBanned },
    { new: true }
  ).select('-password');

  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(httpStatus.OK).json({
    success: true,
    data: user,
    message: isBanned ? 'User banned successfully' : 'User unbanned successfully'
  });
});