// validations/auth.validation.js
const Joi = require('joi');

// Organizer Register Validation
const registerOrganizer = {
    body: Joi.object().keys({
        fullName: Joi.string().required(),
        email: Joi.string().required().email(),
        password: Joi.string().required().min(8),
        businessName: Joi.string().optional().allow(''),
        phoneNumber: Joi.string().optional().allow(''),
    }),
};

// Login Validation
const login = {
    body: Joi.object().keys({
        email: Joi.string().required().email(),
        password: Joi.string().required(),
    }),
};

// Refresh Tokens Validation
const refreshTokens = {
    body: Joi.object().keys({
        refreshToken: Joi.string().required(),
    }),
};

// Forgot Password Validation
const forgotPassword = {
    body: Joi.object().keys({
        email: Joi.string().required().email(),
    }),
};

// Reset Password Validation
const resetPassword = {
    body: Joi.object().keys({
        token: Joi.string().required(),
        email: Joi.string().required().email(),
        password: Joi.string().required().min(8),
        confirmPassword: Joi.string().required().valid(Joi.ref('password')),
    }),
};

// Change Password Validation
const changePassword = {
    body: Joi.object().keys({
        currentPassword: Joi.string().required(),
        newPassword: Joi.string().required().min(8),
        confirmPassword: Joi.string().required().valid(Joi.ref('newPassword')),
    }),
};

// Update Profile Validation
const updateProfile = {
    body: Joi.object().keys({
        fullName: Joi.string().optional().allow(''),
        businessName: Joi.string().optional().allow(''),
        phoneNumber: Joi.string().optional().allow(''),
        address: Joi.string().optional().allow(''),
        city: Joi.string().optional().allow(''),
        state: Joi.string().optional().allow(''),
        bio: Joi.string().optional().allow(''),  // Allow empty string
        website: Joi.string().optional().allow(''),  // Allow empty string
        socialMedia: Joi.object().optional(),
    }),
};

module.exports = {
    registerOrganizer,
    login,
    refreshTokens,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
};