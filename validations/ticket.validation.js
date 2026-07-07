const Joi = require('joi');

const createTicket = {
  body: Joi.object().keys({
    eventId: Joi.string().required(),
    ticketTierId: Joi.string().required(),
    attendees: Joi.array().items(
      Joi.object().keys({
        fullName: Joi.string().required(),
        email: Joi.string().email().required(),
        phone: Joi.string().optional().allow(''),
        matriculationNumber: Joi.string().optional().allow('').max(100)
      })
    ).min(1).max(20).required(),
    paymentReference: Joi.string().required(),
    amount: Joi.number().min(0).required()
  })
};

const getTickets = {
  params: Joi.object().keys({
    eventId: Joi.string().required()
  }),
  query: Joi.object().keys({
    checkedIn: Joi.boolean(),
    status: Joi.string().valid('active', 'checked_in', 'cancelled', 'expired'),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100)
  })
};

const checkInAttendee = {
  params: Joi.object().keys({
    ticketCode: Joi.string().required()
  }),
  body: Joi.object().keys({
    organizerId: Joi.string().optional(),
    checkedBy: Joi.string().optional(),
    notes: Joi.string().optional()
  })
};

const getTicket = {
  params: Joi.object().keys({
    ticketId: Joi.string().required()
  })
};

const cancelTicket = {
  params: Joi.object().keys({
    ticketId: Joi.string().required()
  }),
  body: Joi.object().keys({
    reason: Joi.string().optional()
  })
};

module.exports = {
  createTicket,
  getTickets,
  checkInAttendee,
  getTicket,
  cancelTicket
};