// Reservation Tests
const { checkAvailability, createReservation } = require('../services/reservation.service');

describe('Reservation Service', () => {
  test('should check availability for a table', async () => {
    const available = await checkAvailability('table123', new Date(), '18:00', '20:00');
    expect(typeof available).toBe('boolean');
  });

  test('should create a new reservation', async () => {
    const reservationData = {
      customerId: 'customer123',
      tableId: 'table123',
      reservationDate: new Date(),
      startTime: '18:00',
      endTime: '20:00',
      guestCount: 4
    };
    const reservation = await createReservation(reservationData);
    expect(reservation).toBeDefined();
  });

  test('should prevent double booking', async () => {
    // Simulate double booking prevention
    const available = await checkAvailability('table123', new Date(), '18:00', '20:00');
    expect(available).toBe(false);
  });
});
