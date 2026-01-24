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
    <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-4 shadow-sm sm:p-6">
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
        className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
      >
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
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
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold uppercase text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
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
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:col-span-2 sm:w-auto sm:justify-self-end"
        >
          <Plus size={16} />
          Add Stock
        </button>
      </form>

      {error && <p className="mt-3 text-xs font-medium text-rose-500">{error}</p>}
    </section>
  );
};
