// Reservation Validator
const validateReservation = (data) => {
  const { tableId, reservationDate, startTime, endTime, guestCount } = data;
  
  if (!tableId || !reservationDate || !startTime || !endTime || !guestCount) {
    return { valid: false, error: 'Missing required fields' };
  }
  
  if (new Date(reservationDate) < new Date()) {
    return { valid: false, error: 'Reservation date must be in future' };
  }
  
  if (guestCount < 1) {
    return { valid: false, error: 'Guest count must be at least 1' };
  }
  
  return { valid: true };
};

module.exports = { validateReservation };
