// Customer Reservations Page Component
import React, { useState } from 'react';

const ReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleNewReservation = async (formData) => {
    try {
      setLoading(true);
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Reservation failed');
      
      const newReservation = await response.json();
      setReservations([...reservations, newReservation]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reservations-container">
      <h1>Table Reservations</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {reservations.length === 0 ? (
        <p>No reservations yet</p>
      ) : (
        <ul>
          {reservations.map(res => (
            <li key={res._id}>{res.reservationDate} - {res.guestCount} guests</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ReservationsPage;
