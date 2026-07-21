// Reservation Service for business logic
const Reservation = require('../models/Reservation');
const BookingSlot = require('../models/BookingSlot');

const checkAvailability = async (tableId, date, startTime, endTime) => {
  const conflictingSlots = await BookingSlot.findOne({
    tableId,
    date: new Date(date),
    isBooked: true,
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
    ]
  });
  return !conflictingSlots;
};

const createReservation = async (reservationData) => {
  const reservation = new Reservation(reservationData);
  return await reservation.save();
};

module.exports = { checkAvailability, createReservation };
