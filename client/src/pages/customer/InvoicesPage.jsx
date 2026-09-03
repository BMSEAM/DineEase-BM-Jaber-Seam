import { Link } from 'react-router-dom';
import { invoiceApi } from '../../api/endpoints.js';
import { useAsync } from '../../hooks/useAsync.js';
import { AsyncBoundary } from '../../components/StateViews.jsx';
import { currency, Badge } from '../../components/ui.jsx';

/** F17 Digital Invoice — list of the customer's invoices. */
export default function InvoicesPage() {
  const { data, loading, error, reload } = useAsync(() => invoiceApi.mine(), []);
  const invoices = data?.data || [];

  return (
    <>
      <h1>My Invoices</h1>
      <AsyncBoundary
        loading={loading}
        error={error}
        isEmpty={invoices.length === 0}
        onRetry={reload}
        emptyProps={{ title: 'No invoices yet', hint: 'Invoices are generated after a successful payment.' }}
      >
        <div className="table-wrap mt">
          <table>
            <thead><tr><th>Invoice #</th><th>Date</th><th>Method</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id}>
                  <td>{inv.invoiceNumber}</td>
                  <td>{new Date(inv.issuedAt).toLocaleDateString()}</td>
                  <td><Badge tone="info">{inv.paymentMethod}</Badge></td>
                  <td className="price">{currency(inv.total)}</td>
                  <td><Link className="btn btn-sm" to={`/invoices/${inv._id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AsyncBoundary>
    </>
  );
}
