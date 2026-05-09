const { verify } = require("jsonwebtoken");
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const config = require('../config/auth');
const User = require('../models/user');

const verifyToken = async (req, res, next) => {
    let token = req.headers.authorization;
    
    if (!token) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please provide a token'));
    }
    
    token = token.split(" ")[1];

    verify(token, config.jwt.secret, async (err, decoded) => {
        if (err) {
            console.log(err, "auth error");
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token'));
        }
        
        // For User model only - no actor checking
        const user = await User.findById(decoded.sub);
        
        if (!user) {
            return next(new ApiError(httpStatus.NOT_FOUND, 'User not found'));
        }
        
        req.user = user;
        next();
    });
};

const verifyQueryToken = async (req, res, next) => {
    let token = req.query.token;
    
    if (!token) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please provide a token'));
    }

    verify(token, config.jwt.secret, async (err, decoded) => {
        if (err) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token'));
        }
        
        // For User model only - no actor checking
        const user = await User.findById(decoded.sub);
        
        if (!user) {
            return next(new ApiError(httpStatus.NOT_FOUND, 'User not found'));
        }
        
        req.user = user;
        next();
    });
};

const jwtAuth = {
    verifyToken,
    verifyQueryToken
};

module.exports = jwtAuth;