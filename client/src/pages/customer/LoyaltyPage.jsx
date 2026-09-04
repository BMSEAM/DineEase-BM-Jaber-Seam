import { useState, useEffect } from 'react';
import { loyaltyApi } from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { AsyncBoundary } from '../../components/StateViews.jsx';

export default function LoyaltyPage() {
  const toast = useToast();
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLoyaltyInfo();
  }, []);

  const loadLoyaltyInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await loyaltyApi.get();
      setLoyaltyData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="section-head">
        <div>
          <span className="eyebrow">DineEase Rewards</span>
          <h2>My Loyalty Points</h2>
          <p>Earn points with every order and redeem them for discounts.</p>
        </div>
      </div>

      <AsyncBoundary
        loading={loading}
        error={error}
        isEmpty={!loyaltyData}
        onRetry={loadLoyaltyInfo}
      >
        {loyaltyData && (
          <div className="loyalty-container">
            <div className="card text-center mb" style={{ padding: '2rem', background: 'var(--primary-color)', color: 'var(--text-on-primary)' }}>
              <h3>Current Balance</h3>
              <h1 style={{ fontSize: '3rem', margin: '1rem 0' }}>{loyaltyData.points} pts</h1>
              <p>You can redeem points at checkout! (100 pts = $10 discount)</p>
            </div>

            <h3>Points History</h3>
            {loyaltyData.history && loyaltyData.history.length > 0 ? (
              <div className="grid grid-2 mt">
                {loyaltyData.history.map((tx) => (
                  <div key={tx._id} className="card">
                    <div className="card-body row between">
                      <div>
                        <strong>{tx.description}</strong>
                        <div className="text-sm muted">{new Date(tx.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className={`badge ${tx.type === 'earn' || tx.type === 'refund' ? 'badge-success' : 'badge-danger'}`}>
                        {tx.type === 'earn' || tx.type === 'refund' ? '+' : '-'}{tx.points} pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted mt">No point transactions yet. Start ordering to earn points!</p>
            )}
          </div>
        )}
      </AsyncBoundary>
    </>
  );
}
