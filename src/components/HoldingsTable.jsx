import { Trash2 } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export const HoldingsTable = ({ holdings, prices, onUpdateShares, onRemove }) => {
  const hasHoldings = Array.isArray(holdings) && holdings.length > 0;

  if (!hasHoldings) {
    return (
      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 text-sm text-slate-500 shadow-sm">
        Add a stock to start tracking your portfolio.
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 px-6 py-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-slate-900">Holdings</h3>
          <p className="text-xs text-slate-500">Update shares to recalculate totals.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
          {holdings.length} Symbols
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Symbol
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Shares
              </th>
              <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Current Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Value
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                Delete
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70">
            {holdings.map((holding) => {
              const price = prices[holding.symbol];
              const hasPrice = Number.isFinite(price);
              return (
                <tr key={holding.symbol} className="transition hover:bg-blue-50/40">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                      {holding.symbol}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={holding.shares}
                      onChange={(event) => onUpdateShares(holding.symbol, event.target.value)}
                      className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      aria-label={`Shares for ${holding.symbol}`}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {hasPrice ? currencyFormatter.format(price) : '--'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                    {hasPrice ? currencyFormatter.format(price * holding.shares) : '--'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onRemove(holding.symbol)}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-rose-200 hover:text-rose-500"
                      aria-label={`Remove ${holding.symbol}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
