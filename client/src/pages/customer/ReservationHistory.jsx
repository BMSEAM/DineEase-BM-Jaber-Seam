// F04 Reservation History Component
import React, { useEffect, useState } from 'react';

const ReservationHistory = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReservationHistory();
  }, []);

  const fetchReservationHistory = async () => {
    try {
      const response = await fetch('/api/reservations/history');
      if (!response.ok) throw new Error('Failed to fetch history');
      
      const data = await response.json();
      setReservations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: 'yellow',
      approved: 'green',
      rejected: 'red',
      cancelled: 'gray',
      completed: 'blue'
    };
    return colors[status] || 'gray';
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className='error'>{error}</div>;
  
  return (
    <div className='reservation-history'>
      <h2>Your Reservation History</h2>
      {reservations.length === 0 ? (
        <p>No reservations found</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Guests</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(res => (
              <tr key={res._id}>
                <td>{new Date(res.reservationDate).toLocaleDateString()}</td>
                <td>{res.startTime} - {res.endTime}</td>
                <td>{res.guestCount}</td>
                <td><span className={adge}>{res.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ReservationHistory;
