import { useState, useEffect } from 'react';
import { favouriteApi } from '../../api/endpoints.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { AsyncBoundary } from '../../components/StateViews.jsx';
import { currency, Badge } from '../../components/ui.jsx';
import FoodImage from '../../components/FoodImage.jsx';

export default function FavouritesPage() {
  const toast = useToast();
  const { add, qtyOf, setQty, setOpen, count } = useCart();

  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFavourites();
  }, []);

  const loadFavourites = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await favouriteApi.list();
      setFavourites(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFavourite = async (menuItemId) => {
    try {
      await favouriteApi.remove(menuItemId);
      setFavourites((prev) => prev.filter((fav) => fav.menuItem._id !== menuItemId));
      toast.info('Removed from favourites');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const addToCart = (item) => {
    add(item, 1);
    toast.success(`${item.name} added to cart`);
  };

  return (
    <>
      <div className="section-head">
        <div>
          <span className="eyebrow">Your saved dishes</span>
          <h2>Favourites</h2>
          <p>Quickly access and order the dishes you love the most.</p>
        </div>
      </div>

      <AsyncBoundary
        loading={loading}
        error={error}
        isEmpty={favourites.length === 0}
        onRetry={loadFavourites}
        emptyProps={{
          title: 'No favourites yet',
          hint: 'Browse the menu and click the heart icon to save dishes here.',
          emoji: '🤍'
        }}
      >
        <div className="grid grid-4">
          {favourites.map((fav) => {
            const item = fav.menuItem;
            if (!item) return null; // Defensive check
            const inCart = qtyOf(item._id);

            return (
              <div key={fav._id} className="card food-card">
                <FoodImage src={item.imageUrl} alt={item.name} />
                <div className="card-body">
                  <div className="row between" style={{ alignItems: 'flex-start' }}>
                    <span className="food-name">{item.name}</span>
                    <button
                      className="icon-btn"
                      title="Remove favourite"
                      aria-label={`Remove ${item.name} from favourites`}
                      onClick={() => removeFavourite(item._id)}
                    >
                      ❤️
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
