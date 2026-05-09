// services/user.service.js
const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');
const User = require('../models/user');
const logger = require('../config/logger');

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @returns {Promise<boolean>}
 */
const isEmailTaken = async (email) => {
  const user = await User.findOne({ email });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @param {Object} user
 * @returns {Promise<boolean>}
 */
const isPasswordMatch = async (password, user) => {
  return bcrypt.compareSync(password, user.password);
};

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  userBody.password = bcrypt.hashSync(userBody.password, 8);
  return await User.create(userBody);
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (limit, page, where = {}) => {
  const usersCount = await User.countDocuments(where);
  const users = await User.find(where)
    .skip(page * limit || 0)
    .limit(limit || 10);
  
  const count = limit || 10;
  const currentPage = page || 0;
  const totalPage = Math.ceil(usersCount / count);
  
  return { users, total: usersCount, page: currentPage, count, totalPage };
};

/**
 * Get all users
 * @returns {Promise<User[]>}
 */
const getAllUsers = async () => {
  return await User.find();
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return await User.findById(id);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  return await User.findOne({ email });
};

/**
 * Update user by id
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  
  if (updateBody.email && await isEmailTaken(updateBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  
  if (updateBody.password) {
    updateBody.password = bcrypt.hashSync(updateBody.password, 8);
  }
  
  const updatedUser = await User.findByIdAndUpdate(userId, updateBody, { new: true });
  return updatedUser;
};

/**
 * Delete user by id
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  return user;
};

module.exports = {
  isEmailTaken,
  isPasswordMatch,
  createUser,
  queryUsers,
  getAllUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
};