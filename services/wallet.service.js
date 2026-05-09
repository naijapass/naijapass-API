// services/walletService.js
const Vendor = require("../models/vendor");
const Rider = require("../models/rider");
const Transaction = require("../models/transaction");

async function creditVendor(vendorId, amount) {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    console.error(`Error: Could not find vendor with ID ${vendorId} to credit.`);
    return null;
  }

  vendor.wallet.balance += amount;
  vendor.wallet.availableBalance += amount;

  // Add transaction
  const transaction = await Transaction.create({
    title: "Order credited",
    type: "orders",
    amount,
    color: "green",
  });

  vendor.wallet.transactions.push(transaction._id);
  await vendor.save();
  return vendor;
}

async function creditRider(riderId, amount) {
  const rider = await Rider.findById(riderId);
  if (!rider) {
    console.error(`Error: Could not find rider with ID ${riderId} to credit.`);
    return null;
  }

  rider.wallet.balance += amount;
  rider.wallet.availableBalance += amount;

  // Add transaction
  const transaction = await Transaction.create({
    title: "Delivery credited",
    type: "orders",
    amount,
    color: "green",
  });

  rider.wallet.transactions.push(transaction._id);
  await rider.save();
  return rider;
}

module.exports = { creditVendor, creditRider };
