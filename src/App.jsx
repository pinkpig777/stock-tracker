import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePortfolioData } from './hooks/usePortfolioData';
import { Header } from './components/Header';
import { GrowthChart } from './components/GrowthChart';
import { AddStockForm } from './components/AddStockForm';
import { HoldingsTable } from './components/HoldingsTable';
import { AllocationChart } from './components/AllocationChart';

const STORAGE_KEYS = {
  holdings: 'stock-tracker.holdings',
  buyingPower: 'stock-tracker.buyingPower',
  history: 'stock-tracker.history',
};

const DEFAULT_HOLDINGS = [
  { symbol: 'TSM', shares: 60 },
  { symbol: 'NVDA', shares: 38 },
  { symbol: 'GOOG', shares: 20 },
];

const DEFAULT_BUYING_POWER = 10000;

const readStorage = (key) => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Failed to read storage:', error);
    return null;
  }
};

const writeStorage = (key, value) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
};

const normalizeHoldings = (input) => {
  if (!Array.isArray(input)) {
    return null;
  }

  return input
    .map((item) => ({
      symbol: typeof item?.symbol === 'string' ? item.symbol.trim().toUpperCase() : '',
      shares: Number.parseFloat(item?.shares),
    }))
    .filter((item) => item.symbol && Number.isFinite(item.shares))
    .map((item) => ({ ...item, shares: Math.max(0, item.shares) }));
};

const normalizeHistory = (input) => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((entry) => ({
      timestamp: Number(entry?.timestamp),
      totalValue: Number(entry?.totalValue),
    }))
    .filter((entry) => Number.isFinite(entry.timestamp) && Number.isFinite(entry.totalValue));
};

const getInitialHoldings = () => {
  const stored = normalizeHoldings(readStorage(STORAGE_KEYS.holdings));
  return stored === null ? DEFAULT_HOLDINGS : stored;
};

const getInitialBuyingPower = () => {
  const stored = readStorage(STORAGE_KEYS.buyingPower);
  const parsed = Number.parseFloat(stored);
  return Number.isFinite(parsed) ? parsed : DEFAULT_BUYING_POWER;
};

const getInitialHistory = () => normalizeHistory(readStorage(STORAGE_KEYS.history));

function App() {
  const [holdings, setHoldings] = useState(getInitialHoldings);
  const [buyingPower, setBuyingPower] = useState(getInitialBuyingPower);
  const [history, setHistory] = useState(getInitialHistory);
  const lastSnapshotRef = useRef(null);
  const holdingsRef = useRef(holdings);
  const buyingPowerRef = useRef(buyingPower);

  const symbolsKey = holdings.map((holding) => holding.symbol).join('|');
  const handlePricesUpdate = useCallback((snapshot) => {
    if (!snapshot || lastSnapshotRef.current === snapshot.timestamp) {
      return;
    }

    const currentHoldings = holdingsRef.current;
    const currentBuyingPower = buyingPowerRef.current;
    const stockValue = currentHoldings.reduce((sum, holding) => {
      const price = snapshot.prices[holding.symbol] || 0;
      return sum + price * holding.shares;
    }, 0);

    const total = stockValue + (Number.isFinite(currentBuyingPower) ? currentBuyingPower : 0);
    if (!Number.isFinite(total)) {
      return;
    }

    setHistory((prev) => [
      ...prev,
      { timestamp: snapshot.timestamp, totalValue: Math.round(total * 100) / 100 },
    ]);
    lastSnapshotRef.current = snapshot.timestamp;
  }, []);

  useEffect(() => {
    holdingsRef.current = holdings;
  }, [holdings]);

  useEffect(() => {
    buyingPowerRef.current = buyingPower;
  }, [buyingPower]);

  const { prices, loading, lastUpdated, error, refetch } = usePortfolioData(symbolsKey, {
    onPricesUpdate: handlePricesUpdate,
  });

  const stockValue = useMemo(
    () =>
      holdings.reduce((sum, holding) => {
        const price = prices[holding.symbol] || 0;
        return sum + price * holding.shares;
      }, 0),
    [holdings, prices]
  );

  const totalValue = stockValue + (Number.isFinite(buyingPower) ? buyingPower : 0);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.holdings, holdings);
  }, [holdings]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.buyingPower, buyingPower);
  }, [buyingPower]);

  useEffect(() => {
    writeStorage(STORAGE_KEYS.history, history);
  }, [history]);

  const handleAddStock = ({ symbol, shares }) => {
    const safeShares = Number.isFinite(shares) ? Math.max(0, shares) : 0;
    if (!symbol || safeShares <= 0) {
      return;
    }

    setHoldings((prev) => {
      const existing = prev.find((holding) => holding.symbol === symbol);
      if (existing) {
        return prev.map((holding) =>
          holding.symbol === symbol
            ? { ...holding, shares: holding.shares + safeShares }
            : holding
        );
      }
      return [...prev, { symbol, shares: safeShares }];
    });
  };

  const handleUpdateShares = (symbol, value) => {
    const parsed = Number.parseFloat(value);
    const nextShares = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    setHoldings((prev) =>
      prev.map((holding) =>
        holding.symbol === symbol ? { ...holding, shares: nextShares } : holding
      )
    );
  };

  const handleRemoveStock = (symbol) => {
    setHoldings((prev) => prev.filter((holding) => holding.symbol !== symbol));
  };

  const handleBuyingPowerChange = (value) => {
    const parsed = Number.parseFloat(value);
    setBuyingPower(Number.isFinite(parsed) ? Math.max(0, parsed) : 0);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-dashboard-grid" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-32 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-200/70 via-sky-200/40 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-gradient-to-br from-slate-200/90 via-blue-100/70 to-transparent blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 pb-12 pt-8 md:px-6 md:pt-12">
        <Header
          totalValue={totalValue}
          buyingPower={buyingPower}
          onBuyingPowerChange={handleBuyingPowerChange}
          lastUpdated={lastUpdated}
          loading={loading}
          onRefresh={refetch}
        />

        {error && (
          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
            {error}. Add <span className="font-semibold">VITE_FINNHUB_API_KEY</span> to your
            .env file.
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <GrowthChart history={history} />
            <AddStockForm onAdd={handleAddStock} />
            <HoldingsTable
              holdings={holdings}
              prices={prices}
              onUpdateShares={handleUpdateShares}
              onRemove={handleRemoveStock}
            />
          </div>
          <div className="space-y-6">
            <AllocationChart stockValue={stockValue} cashValue={buyingPower} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
