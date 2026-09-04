import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { menuApi, reviewApi } from '../api/endpoints.js';
import FoodImage from '../components/FoodImage.jsx';
import { currency } from '../components/ui.jsx';

/**
 * Marketing landing page. Editorial hierarchy inspired by the reference layout:
 * a two-column hero, a chef's-selection food grid, dining benefits, a
 * reservation callout, and real customer testimonials. All copy and imagery are
 * original to DineEase. No background image — food photography lives only in
 * meaningful content (the hero dish and the dish cards).
 */
export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState({ averageRating: 0, total: 0 });

  useEffect(() => {
    menuApi.list({ sort: 'newest', limit: 6, available: true }).then((r) => setFeatured(r.data)).catch(() => {});
    reviewApi
      .list()
      .then((r) => {
        setReviews(r.data.slice(0, 3));
        setRating(r.meta || { averageRating: 0, total: 0 });
      })
      .catch(() => {});
  }, []);

  const hero = featured[0];

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-grid">
          <div>
            <span className="hero-eyebrow">🍽️ Fresh · Local · Made to order</span>
            <h1>A better way to dine, reserve &amp; order.</h1>
            <p className="hero-lead">
              Reserve your table in seconds, pre-order your favourites, or grab takeaway on the go.
              DineEase brings the whole experience together — no phone calls, no queues.
            </p>
            <div className="hero-cta">
              <Link to="/menu" className="btn btn-lg">Order Now</Link>
              <Link to="/reservations" className="btn btn-lg btn-ghost">Reserve a Table</Link>
            </div>
            <div className="hero-facts">
              <div className="hero-fact">
                {rating.total > 0
                  ? <><div className="n">{rating.averageRating}★</div><div className="l">Guest rating · {rating.total} review{rating.total === 1 ? '' : 's'}</div></>
                  : <><div className="n">New</div><div className="l">No ratings yet</div></>}
              </div>
              <div className="hero-fact"><div className="n">90<span style={{ fontSize: '1rem' }}>min</span></div><div className="l">Relaxed dining slots</div></div>
              <div className="hero-fact"><div className="n">2 ways</div><div className="l">Dine-in &amp; takeaway</div></div>
            </div>
          </div>
          <div className="hero-media">
            <FoodImage src={hero?.imageUrl} alt={hero?.name || 'Signature plated dish'} eager emoji="🍛" />
            {hero && (
              <div className="hero-chip">
                <span style={{ fontSize: '1.4rem' }} aria-hidden="true">👨‍🍳</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{hero.name}</div>
                  <div className="muted text-sm">Chef’s pick · {currency(hero.price)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Chef's selection */}
      <section>
        <div className="section-head">
          <div>
            <span className="eyebrow">From the kitchen</span>
            <h2>Chef’s selection</h2>
            <p>A taste of what’s cooking. Browse the full menu to order or pre-order.</p>
          </div>
          <Link to="/menu" className="btn btn-soft">View full menu →</Link>
        </div>
        <div className="grid grid-3">
          {featured.map((item) => (
            <Link key={item._id} to="/menu" className="card food-card">
              <FoodImage src={item.imageUrl} alt={item.name} />
              <div className="card-body">
                <span className="food-name">{item.name}</span>
                <span className="text-sm muted">{item.category?.name}</span>
                <div className="row between mt">
                  <span className="price">{currency(item.price)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="mt">
        <div className="grid grid-3">
          {[
            { icon: '📅', title: 'Instant reservations', text: 'Pick a table, time and seating preference. Confirmed the moment staff approve.' },
            { icon: '🥡', title: 'Order without a booking', text: 'Craving takeaway? Add to cart and check out — no reservation required.' },
            { icon: '🎁', title: 'Loyalty rewards', text: 'Earn points on every paid order and redeem them for discounts.' },
          ].map((b) => (
            <div key={b.title} className="card"><div className="card-body">
              <div style={{ fontSize: '1.8rem' }} aria-hidden="true">{b.icon}</div>
              <h3 style={{ marginTop: '0.5rem' }}>{b.title}</h3>
              <p className="muted" style={{ margin: 0 }}>{b.text}</p>
            </div></div>
          ))}
        </div>
      </section>

      {/* Reservation callout */}
      <section className="mt">
        <div className="card" style={{ background: 'var(--brand-soft)', borderColor: 'transparent' }}>
          <div className="card-body row between" style={{ gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0 }}>Planning something special?</h2>
              <p className="muted" style={{ margin: '0.3rem 0 0' }}>Reserve a table and pre-order so your food is ready when you arrive.</p>
            </div>
            <Link to="/reservations" className="btn btn-lg">Reserve a Table</Link>
          </div>
        </div>
      </section>

      {/* Testimonials (real data only) */}
      {reviews.length > 0 && (
        <section className="mt">
          <div className="section-head">
            <div>
              <span className="eyebrow">Loved by guests</span>
              <h2>What diners say</h2>
            </div>
          </div>
          <div className="grid grid-3">
            {reviews.map((r) => (
              <div key={r._id} className="card"><div className="card-body">
                <div aria-hidden="true" style={{ color: 'var(--warn)' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                <p style={{ marginTop: '0.4rem' }}>{r.comment || 'Great experience!'}</p>
                <p className="muted text-sm" style={{ margin: 0 }}>— {r.customer?.name || 'Guest'}</p>
              </div></div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
