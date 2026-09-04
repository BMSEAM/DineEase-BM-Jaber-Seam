import { useState, useEffect } from 'react';
import { reviewApi } from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { AsyncBoundary } from '../../components/StateViews.jsx';

export default function ReviewsPage() {
  const toast = useToast();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await reviewApi.mine();
      setReviews(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await reviewApi.remove(id);
      setReviews((prev) => prev.filter((r) => r._id !== id));
      toast.success('Review deleted');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <div className="section-head">
        <div>
          <span className="eyebrow">Your feedback</span>
          <h2>My Reviews</h2>
          <p>Manage your ratings and reviews for past visits.</p>
        </div>
      </div>

      <AsyncBoundary
        loading={loading}
        error={error}
        isEmpty={reviews.length === 0}
        onRetry={loadReviews}
        emptyProps={{
          title: 'No reviews yet',
          hint: 'After a visit, you can leave a review.',
          emoji: '⭐'
        }}
      >
        <div className="grid grid-3">
          {reviews.map((r) => (
            <div key={r._id} className="card">
              <div className="card-body">
                <div className="row between mb">
                  <strong>{'⭐'.repeat(r.rating)}</strong>
                  <span className="text-sm muted">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <p>{r.comment || <em className="muted">No comment provided</em>}</p>
                <div className="mt" style={{ textAlign: 'right' }}>
                  <button className="btn btn-sm btn-ghost text-danger" onClick={() => handleDelete(r._id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AsyncBoundary>
    </>
  );
}
