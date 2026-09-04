import { useState, useEffect, useCallback, useRef } from 'react';
import { menuApi, favouriteApi } from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { AsyncBoundary } from '../../components/StateViews.jsx';
import { Badge, currency } from '../../components/ui.jsx';
import FoodImage from '../../components/FoodImage.jsx';

const PAGE_SIZE = 12;

/** F01 Restaurant Menu + F02 Search/Filter + F06 favourites + Order (cart). */
export default function MenuPage() {
  const toast = useToast();
  const { isAuthenticated } = useAuth();
  const { add, qtyOf, setQty, setOpen, count } = useCart();

  const [filters, setFilters] = useState({ search: '', category: '', maxPrice: '', available: '', sort: 'name' });
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [favIds, setFavIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const reqId = useRef(0);

  useEffect(() => {
    menuApi.categories().then((r) => setCategories(r.data)).catch(() => {});
    if (isAuthenticated) {
      favouriteApi.list().then((r) => setFavIds(new Set(r.data.map((f) => f.menuItem?._id).filter(Boolean)))).catch(() => {});
    }
  }, [isAuthenticated]);

  const buildParams = useCallback(
    (page) => {
      const params = { sort: filters.sort, page, limit: PAGE_SIZE };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.available !== '') params.available = filters.available;
      return params;
    },
    [filters]
  );

  // Load page 1 whenever filters change (with debounce for typing).
  const loadFirst = useCallback(() => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    menuApi
      .list(buildParams(1))
      .then((r) => {
        if (id !== reqId.current) return; // stale response
        setItems(r.data);
        setMeta(r.meta || { page: 1, totalPages: 1, total: r.data.length });
      })
      .catch((e) => id === reqId.current && setError(e.message))
      .finally(() => id === reqId.current && setLoading(false));
  }, [buildParams]);

  useEffect(() => {
    const t = setTimeout(loadFirst, 250);
    return () => clearTimeout(t);
  }, [loadFirst]);

  // Load More appends the next page so every item (incl. #13) is reachable.
  const loadMore = async () => {
    const next = meta.page + 1;
    setLoadingMore(true);
    try {
      const r = await menuApi.list(buildParams(next));
      setItems((prev) => [...prev, ...r.data]);
      setMeta(r.meta || meta);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleFav = async (item) => {
    if (!isAuthenticated) {
      toast.info('Sign in to save favourites');
      return;
    }
    try {
      if (favIds.has(item._id)) {
        await favouriteApi.remove(item._id);
        setFavIds((s) => new Set([...s].filter((id) => id !== item._id)));
        toast.info('Removed from favourites');
      } else {
        await favouriteApi.add(item._id);
        setFavIds((s) => new Set(s).add(item._id));
        toast.success('Added to favourites');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const addToCart = (item) => {
    add(item, 1);
    toast.success(`${item.name} added to cart`);
  };

  const hasMore = meta.page < meta.totalPages;

  return (
    <>
      <div className="section-head">
        <div>
          <span className="eyebrow">Explore the menu</span>
          <h2>Order &amp; discover dishes</h2>
          <p>Browse freely. Add to cart for takeaway, or save favourites for your next visit.</p>
        </div>
      </div>

      {/* Category chips */}
      <div className="chips mb">
        <button className={`chip ${filters.category === '' ? 'active' : ''}`} onClick={() => setFilters((f) => ({ ...f, category: '' }))}>
          All
        </button>
        {categories.map((c) => (
          <button key={c._id} className={`chip ${filters.category === c._id ? 'active' : ''}`} onClick={() => setFilters((f) => ({ ...f, category: c._id }))}>
            {c.name}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="filters mb">
        <input placeholder="Search food by name…" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} aria-label="Search dishes" />
        <input type="number" placeholder="Max price" value={filters.maxPrice} onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })} aria-label="Maximum price" />
        <select value={filters.available} onChange={(e) => setFilters({ ...filters, available: e.target.value })} aria-label="Availability">
          <option value="">Any status</option>
          <option value="true">Available</option>
          <option value="false">Unavailable</option>
        </select>
        <select value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })} aria-label="Sort">
          <option value="name">Name A–Z</option>
          <option value="price">Price low→high</option>
          <option value="-price">Price high→low</option>
          <option value="newest">Newest</option>
        </select>
      </div>

      <AsyncBoundary
        loading={loading}
        error={error}
        isEmpty={items.length === 0}
        onRetry={loadFirst}
        emptyProps={{ title: 'No dishes match your filters', hint: 'Try clearing the search or price filter.', emoji: '🔍' }}
      >
        <p className="muted text-sm mb">Showing {items.length} of {meta.total} dishes</p>
        <div className="grid grid-4">
          {items.map((item) => {
            const inCart = qtyOf(item._id);
            return (
              <div key={item._id} className="card food-card">
                <FoodImage src={item.imageUrl} alt={item.name} />
                <div className="card-body">
                  <div className="row between" style={{ alignItems: 'flex-start' }}>
                    <span className="food-name">{item.name}</span>
                    <button className="icon-btn" title={isAuthenticated ? 'Toggle favourite' : 'Sign in to favourite'} aria-label={`Favourite ${item.name}`} onClick={() => toggleFav(item)}>
                      {favIds.has(item._id) ? '❤️' : '🤍'}
                    </button>
                  </div>
                  <span className="text-sm muted">{item.category?.name}</span>
                  <p className="text-sm muted" style={{ flex: 1 }}>{item.description}</p>
                  <div className="row between">
                    <span className="price">{currency(item.price)}</span>
                    {item.isAvailable ? <Badge tone="success">Available</Badge> : <Badge tone="neutral">Sold out</Badge>}
                  </div>
                  {item.isAvailable && (
                    inCart > 0 ? (
                      <div className="row between">
                        <div className="qty">
                          <button onClick={() => setQty(item._id, inCart - 1)} aria-label={`Decrease ${item.name}`}>−</button>
                          <span>{inCart}</span>
                          <button onClick={() => setQty(item._id, inCart + 1)} aria-label={`Increase ${item.name}`}>+</button>
                        </div>
                        <button className="btn btn-sm btn-soft" onClick={() => setOpen(true)}>View cart</button>
                      </div>
                    ) : (
                      <button className="btn btn-sm btn-block" onClick={() => addToCart(item)}>Add to Cart</button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {hasMore && (
          <div className="pagination">
            <button className="btn btn-ghost" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : `Load more (${meta.total - items.length} left)`}
            </button>
          </div>
        )}
      </AsyncBoundary>

      {count > 0 && (
        <div className="sticky-cart">
          <div style={{ flex: 1 }}>
            <strong>{count} item{count === 1 ? '' : 's'}</strong> in cart
          </div>
          <button className="btn" onClick={() => setOpen(true)}>View cart</button>
        </div>
      )}
    </>
  );
}
