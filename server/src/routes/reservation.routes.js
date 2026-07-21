// Reservation Routes
const express = require('express');
const { createReservationHandler, getReservationHistory } = require('../controllers/reservation.controller');

const router = express.Router();

router.post('/', createReservationHandler);
router.get('/history', getReservationHistory);

module.exports = router;
