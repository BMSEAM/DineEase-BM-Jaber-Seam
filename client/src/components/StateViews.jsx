/** Reusable loading / empty / error / inline states used across every page. */

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="state state-loading" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <span className="state-emoji" aria-hidden="true">⚠️</span>
      <p className="empty-title">Something went wrong</p>
      <p className="muted">{message}</p>
      {onRetry && (
        <button className="btn btn-sm" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', hint, emoji = '🍽️', action }) {
  return (
    <div className="state state-empty">
      <span className="state-emoji" aria-hidden="true">{emoji}</span>
      <p className="empty-title">{title}</p>
      {hint && <p className="muted">{hint}</p>}
      {action}
    </div>
  );
}

/** Wraps async content: shows loading/error/empty, else renders children. */
export function AsyncBoundary({ loading, error, isEmpty, onRetry, emptyProps, children }) {
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (isEmpty) return <EmptyState {...emptyProps} />;
  return children;
}
