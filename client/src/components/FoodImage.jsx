import { useState, useEffect } from 'react';

/**
 * Reusable food image with a branded local fallback.
 *
 * - Meaningful alt text (falls back to the dish name).
 * - Lazy-loaded by default, with a fixed aspect ratio + object-fit: cover so
 *   the grid never shifts while images load.
 * - On an empty OR broken `src` it shows a branded placeholder instead of the
 *   browser's broken-image icon. The error handler flips state once (no
 *   infinite onError loop) and also covers older DB records with blank imageUrl.
 */
export default function FoodImage({
  src,
  alt,
  emoji = '🍽️',
  label = 'DineEase',
  className = '',
  eager = false,
  rounded = false,
}) {
  const [failed, setFailed] = useState(!src);
  const [loaded, setLoaded] = useState(false);

  // Reset when the source changes (e.g. admin edits an image URL).
  useEffect(() => {
    setFailed(!src);
    setLoaded(false);
  }, [src]);

  const showFallback = failed || !src;

  return (
    <div
      className={`food-img ${!loaded && !showFallback ? 'is-loading' : ''} ${className}`}
      style={rounded ? { borderRadius: 'inherit' } : undefined}
    >
      {!showFallback && (
        <img
          src={src}
          alt={alt || 'Dish'}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
      {showFallback && (
        <div className="food-img-fallback" role="img" aria-label={alt || `${label} dish`}>
          <span className="fi-emoji" aria-hidden="true">{emoji}</span>
          <span className="fi-label">{label}</span>
        </div>
      )}
    </div>
  );
}
