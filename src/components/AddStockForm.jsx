import { useState } from 'react';
import { Plus } from 'lucide-react';

export const AddStockForm = ({ onAdd }) => {
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedSymbol = symbol.trim().toUpperCase();
    const parsedShares = Number.parseFloat(shares);

    if (!trimmedSymbol) {
      setError('Enter a stock symbol.');
      return;
    }

    if (!Number.isFinite(parsedShares) || parsedShares <= 0) {
      setError('Enter shares greater than 0.');
      return;
    }

    onAdd({ symbol: trimmedSymbol, shares: parsedShares });
    setSymbol('');
    setShares('');
    setError('');
  };

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold text-slate-900">Add Position</h3>
          <p className="text-xs text-slate-500">
            Add a symbol and share count to your portfolio.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-4 flex flex-col gap-3 md:flex-row md:items-end"
      >
        <div className="flex-1">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Symbol
          </label>
          <input
            type="text"
            value={symbol}
            onChange={(event) => {
              setSymbol(event.target.value);
              setError('');
            }}
            placeholder="AAPL"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold uppercase text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Shares
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={shares}
            onChange={(event) => {
              setShares(event.target.value);
              setError('');
            }}
            placeholder="10"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={16} />
          Add Stock
        </button>
      </form>

      {error && <p className="mt-3 text-xs font-medium text-rose-500">{error}</p>}
    </section>
  );
};
