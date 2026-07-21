// F04 Reservation History Routes
const express = require('express');

const router = express.Router();

router.get('/history', getReservationHistory);
router.get('/history/:id', getReservationById);

module.exports = router;
