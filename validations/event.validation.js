// validations/event.validation.js
const Joi = require('joi');

// validations/event.validation.js
const createEvent = {
    body: Joi.object().keys({
        title: Joi.string().required(),
        category: Joi.string().required(),
        description: Joi.string().required(),
        venue: Joi.string().required(),
        address: Joi.string().optional().allow(''),
        city: Joi.string().required(),
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
        startTime: Joi.string().optional().allow(''),
        endTime: Joi.string().optional().allow(''),
        organizerName: Joi.string().required(),
        organizerEmail: Joi.string().required().email(),
        organizerPhone: Joi.string().optional().allow(''),
        // Accept either array or JSON string
        ticketTiers: Joi.alternatives().try(
            Joi.array().items(
                Joi.object({
                    name: Joi.string().required(),
                    price: Joi.number().required().min(0),
                    quantity: Joi.number().required().min(0),
                    maxPerPerson: Joi.number().default(1),
                    description: Joi.string().optional().allow('')
                })
            ),
            Joi.string().custom((value, helpers) => {
                try {
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) return parsed;
                    return helpers.error('any.invalid');
                } catch {
                    return helpers.error('any.invalid');
                }
            })
        ).required(),
        faq: Joi.alternatives().try(
            Joi.array().items(
                Joi.object({
                    question: Joi.string().optional().allow(''),
                    answer: Joi.string().optional().allow('')
                })
            ),
            Joi.string().custom((value, helpers) => {
                try {
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) return parsed;
                    return helpers.error('any.invalid');
                } catch {
                    return helpers.error('any.invalid');
                }
            })
        ).optional().default([])
    })
};

const updateEvent = {
    params: Joi.object().keys({
        eventId: Joi.string().required()
    }),
    body: Joi.object().keys({
        title: Joi.string().optional(),
        category: Joi.string().optional().valid('Concert', 'Festival', 'Conference', 'Workshop', 'Sports', 'Theater', 'Comedy', 'Exhibition', 'Networking', 'Other'),
        description: Joi.string().optional(),
        venue: Joi.string().optional(),
        address: Joi.string().optional().allow(''),
        city: Joi.string().optional(),
        startDate: Joi.date().optional(),
        endDate: Joi.date().optional(),
        startTime: Joi.string().optional().allow(''),
        endTime: Joi.string().optional().allow(''),
        bannerImage: Joi.string().optional().allow(''),
        organizerName: Joi.string().optional(),
        organizerEmail: Joi.string().optional().email(),
        organizerPhone: Joi.string().optional().allow(''),
        ticketTiers: Joi.array().items(
            Joi.object({
                name: Joi.string().required(),
                price: Joi.number().required().min(0),
                quantity: Joi.number().required().min(0),
                maxPerPerson: Joi.number().default(1),
                description: Joi.string().optional().allow('')
            })
        ).optional(),
        faq: Joi.array().items(
            Joi.object({
                question: Joi.string().optional().allow(''),
                answer: Joi.string().optional().allow('')
            })
        ).optional(),
        status: Joi.string().optional().valid('draft', 'published', 'cancelled', 'completed')
    })
};

module.exports = {
    createEvent,
    updateEvent
};