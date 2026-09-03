import { useParams, Link } from 'react-router-dom';
import { invoiceApi } from '../../api/endpoints.js';
import { useAsync } from '../../hooks/useAsync.js';
import { AsyncBoundary } from '../../components/StateViews.jsx';
import { currency } from '../../components/ui.jsx';

/** F17 — printable/downloadable invoice document. */
export default function InvoiceDetailPage() {
  const { id } = useParams();
  const { data, loading, error, reload } = useAsync(() => invoiceApi.get(id), [id]);
  const inv = data?.data;

  return (
    <>
      <div className="row between no-print">
        <Link to="/invoices" className="btn btn-sm btn-ghost">← Back</Link>
        {inv && <button className="btn btn-sm" onClick={() => window.print()}>Download / Print</button>}
      </div>

      <AsyncBoundary loading={loading} error={error} isEmpty={false} onRetry={reload}>
        {inv && (
          <div className="invoice-doc mt">
            <div className="row between">
              <div>
                <h2>🍽️ DineEase</h2>
                <p>Smart Restaurant Reservation & Management</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3>INVOICE</h3>
                <p>{inv.invoiceNumber}</p>
                <p>{new Date(inv.issuedAt).toLocaleString()}</p>
              </div>
            </div>

            <hr />
            <div className="row between">
              <div>
                <strong>Billed to</strong>
                <p>{inv.customerName}<br />{inv.customerEmail}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <strong>Payment</strong>
                <p>{inv.paymentMethod.toUpperCase()}<br />Ref: {inv.transactionRef}</p>
              </div>
            </div>

            <table className="mt">
              <thead><tr><th>Item</th><th>Unit</th><th>Qty</th><th>Total</th></tr></thead>
              <tbody>
                {inv.items.map((it, i) => (
                  <tr key={i}>
                    <td>{it.name}</td>
                    <td>{currency(it.unitPrice)}</td>
                    <td>{it.quantity}</td>
                    <td>{currency(it.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ marginLeft: 'auto', width: 260 }} className="mt">
              <div className="row between"><span>Subtotal</span><span>{currency(inv.subtotal)}</span></div>
              {inv.discount > 0 && <div className="row between"><span>Loyalty discount</span><span>−{currency(inv.discount)}</span></div>}
              <div className="row between"><span>VAT</span><span>{currency(inv.vat)}</span></div>
              <div className="row between"><strong>Total</strong><strong>{currency(inv.total)}</strong></div>
            </div>

            <p className="center mt muted">Thank you for dining with DineEase!</p>
          </div>
        )}
      </AsyncBoundary>
    </>
  );
}
