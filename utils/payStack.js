// utils/paystack.js
const axios = require("axios");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const BASE_URL = "https://api.paystack.co";

const paystack = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

module.exports = {
  // Initialize transaction
  async initializePayment({ email, amount, callback_url }) {
    const body = {
      email,
      amount: amount * 100, // convert to kobo
      callback_url,
    };
    const { data } = await paystack.post("/transaction/initialize", body);
    return data;
  },

  // Verify payment
  async verifyPayment(reference) {
    const { data } = await paystack.get(`/transaction/verify/${reference}`);
    return data;
  },

  // Create customer
  async createCustomer(email, firstName, lastName, phone) {
    const { data } = await paystack.post("/customer", {
      email,
      first_name: firstName,
      last_name: lastName,
      phone,
    });
    return data.data; // Contains customer_code
  },

  // Create dedicated account
  async createDedicatedAccount(customerCode, preferredBank = "wema-bank") {
    const { data } = await paystack.post("/dedicated_account", {
      customer: customerCode,
      preferred_bank: preferredBank,
    });
    return data.data; // bank details
  },

  // Delete dedicated account
  async deleteDedicatedAccount(dedicatedAccountId) {
    const { data } = await paystack.delete(`/dedicated_account/${dedicatedAccountId}`);
    return data;
  },

  // Get bank code from name
  async getBankCode(bankName) {
    const { data } = await paystack.get("/bank");
    const bank = data.data.find(b => b.name.toLowerCase() === bankName.toLowerCase());
    if (!bank) throw new Error("Bank not found");
    return bank.code;
  },

  // Create transfer recipient
  async createTransferRecipient(payload) {
    const { data } = await paystack.post("/transferrecipient", payload);
    return data.data;
  },

  // Initiate transfer
  async initiateTransfer(payload) {
    const { data } = await paystack.post("/transfer", payload);
    return data.data;
  }
};
