// F04 Reservation History Controller
const getReservationHistory = async (req, res) => {
  try {
    const reservations = await Reservation.find({ 
      customerId: req.user.id 
    }).sort({ createdAt: -1 });
    
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getReservationById = async (req, res) => {
  const { id } = req.params;
  const reservation = await Reservation.findById(id);
  
  if (!reservation || reservation.customerId.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  res.json(reservation);
};

module.exports = { getReservationHistory, getReservationById };
