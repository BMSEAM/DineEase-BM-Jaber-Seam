// BookingSlot Model for tracking table availability
const mongoose = require('mongoose');

const bookingSlotSchema = new mongoose.Schema({
  tableId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reservationId: { type: mongoose.Schema.Types.ObjectId },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  isBooked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BookingSlot', bookingSlotSchema);
