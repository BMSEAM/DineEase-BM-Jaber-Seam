// Reservation Controller for handling requests
const { checkAvailability, createReservation } = require('../services/reservation.service');

const createReservationHandler = async (req, res) => {
  try {
    const { tableId, reservationDate, startTime, endTime, guestCount } = req.body;
    
    // Check availability
    const isAvailable = await checkAvailability(tableId, reservationDate, startTime, endTime);
    if (!isAvailable) {
      return res.status(409).json({ error: 'Table not available for this time slot' });
    }

    const reservation = await createReservation({
      customerId: req.user.id,
      tableId,
      reservationDate,
      startTime,
      endTime,
      guestCount
    });

    res.status(201).json(reservation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getReservationHistory = async (req, res) => {
  const reservations = await Reservation.find({ customerId: req.user.id });
  res.json(reservations);
};

module.exports = { createReservationHandler, getReservationHistory };
