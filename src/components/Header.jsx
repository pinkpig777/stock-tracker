import { RefreshCw, Wallet, LogOut, Download, Upload } from 'lucide-react';
import { useRef } from 'react';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
});

export const Header = ({
  totalValue,
  buyingPower,
  onBuyingPowerChange,
  lastUpdated,
  loading,
  onRefresh,
  userEmail,
  onLogout,
  onExport,
  onImport,
}) => {
  const formattedTotal = currencyFormatter.format(Number.isFinite(totalValue) ? totalValue : 0);
  const updatedLabel = loading ? 'Syncing quotes' : 'Last updated';
  const updatedValue = lastUpdated ? timeFormatter.format(new Date(lastUpdated)) : '--';
  const fileInputRef = useRef(null);

  return (
    <header className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-6">
      <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Personal Portfolio
            </p>
            {userEmail && (
              <span
                title={userEmail}
                className="max-w-[180px] truncate rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 sm:max-w-none"
              >
                {userEmail}
              </span>
            )}
          </div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl md:text-4xl">
            Asset-Dashboard
          </h1>
          <p className="text-sm text-slate-500">
            Monitor live prices, cash balance, and growth over time.
          </p>
        </div>
        
        <div className="grid w-full grid-cols-4 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <input
                type="file"
                accept=".json"
                className="hidden"
                ref={fileInputRef}
                onChange={onImport}
            />
            
            <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700 sm:w-auto sm:px-3"
            title="Import JSON"
            >
            <Upload size={16} />
            <span className="hidden sm:inline">Import</span>
            </button>

            <button
            type="button"
            onClick={onExport}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700 sm:w-auto sm:px-3"
            title="Export JSON"
            >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
            </button>

            <button
            type="button"
            onClick={onRefresh}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-700 sm:w-auto sm:px-3"
            >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
            type="button"
            onClick={onLogout}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-2.5 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100 sm:w-auto sm:px-3"
            >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
            </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:mt-6 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-4 text-white shadow-lg sm:p-5 md:col-span-2">
          <div className="pointer-events-none absolute -right-20 -top-12 h-40 w-40 rounded-full bg-blue-400/20 blur-2xl" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
                Total Net Worth
              </p>
              <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {formattedTotal}
              </h2>
            </div>
            <div className="text-xs text-white/70">
              <p>{updatedLabel}</p>
              <p className="text-sm font-semibold text-white">{updatedValue}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Buying Power
            </span>
            <Wallet size={16} className="text-slate-400" />
          </div>
          <input
            type="number"
            min="0"
            step="0.01"
            value={buyingPower}
            onChange={(event) => onBuyingPowerChange(event.target.value)}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            aria-label="Buying power"
          />
          <p className="mt-2 text-xs text-slate-400">Cash available for trades.</p>
        </div>
      </div>
    </header>
  );
};
