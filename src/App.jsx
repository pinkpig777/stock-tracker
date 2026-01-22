import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import { usePortfolioData } from './hooks/usePortfolioData';
import { Header } from './components/Header';
import { GrowthChart } from './components/GrowthChart';
import { AddStockForm } from './components/AddStockForm';
import { HoldingsTable } from './components/HoldingsTable';
import { AllocationChart } from './components/AllocationChart';
import { Auth } from './components/Auth';

function App() {
  const [session, setSession] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [buyingPower, setBuyingPower] = useState(10000);
  // Note: 'history' is currently session-only as per requirements (simplification), 
  // but we could persist it if needed. For now keeping it local state.
  const [history, setHistory] = useState([]); 
  const [loadingConfig, setLoadingConfig] = useState(true);

  const lastSnapshotRef = useRef(null);
  const holdingsRef = useRef(holdings);
  const buyingPowerRef = useRef(buyingPower);

  // 1. Auth & Initial Load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserData();
      setLoadingConfig(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserData();
      else {
        setHoldings([]);
        setBuyingPower(10000);
        setHistory([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async () => {
    try {
      // Fetch Holdings
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolios')
        .select('*');

      if (portfolioError) throw portfolioError;

      // Fetch Settings (Buying Power)
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('buying_power')
        .single();
      
      // It's possible settings don't exist yet for new users
      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error('Error fetching settings:', settingsError);
      }

      if (portfolioData) {
        setHoldings(
            portfolioData.map(item => ({
                id: item.id,
                symbol: item.symbol, 
                shares: Number(item.shares) 
            }))
        );
      }

      if (settingsData) {
        setBuyingPower(Number(settingsData.buying_power));
      }

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // 2. Data Sync
  // Keep refs updated for the price socket callback
  useEffect(() => {
    holdingsRef.current = holdings;
  }, [holdings]);

  useEffect(() => {
    buyingPowerRef.current = buyingPower;
  }, [buyingPower]);

  // 3. Price Updates & History
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
    
    if (!Number.isFinite(total)) return;

    setHistory((prev) => [
      ...prev,
      { timestamp: snapshot.timestamp, totalValue: Math.round(total * 100) / 100 },
    ]);
    lastSnapshotRef.current = snapshot.timestamp;
  }, []);

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

  // 4. Actions
  const handleAddStock = async ({ symbol, shares }) => {
    const safeShares = Number.isFinite(shares) ? Math.max(0, shares) : 0;
    if (!symbol || safeShares <= 0 || !session) return;

    // Optimistic Update
    const existingIndex = holdings.findIndex(h => h.symbol === symbol);
    let newHoldings = [...holdings];
    
    try {
        if (existingIndex >= 0) {
            // Update existing
            const newShareCount = newHoldings[existingIndex].shares + safeShares;
             // DB
            const { error } = await supabase
                .from('portfolios')
                .update({ shares: newShareCount })
                .eq('user_id', session.user.id)
                .eq('symbol', symbol);
            
            if (error) throw error;
            
            newHoldings[existingIndex].shares = newShareCount;
            setHoldings(newHoldings);

        } else {
            // Insert new
            const { data, error } = await supabase
                .from('portfolios')
                .insert([{ user_id: session.user.id, symbol, shares: safeShares }])
                .select()
                .single();
            
            if (error) throw error;
            
            setHoldings(prev => [...prev, { id: data.id, symbol: data.symbol, shares: Number(data.shares) }]);
        }
    } catch (err) {
        console.error("Error adding stock:", err);
        alert("Failed to save stock. Please try again.");
    }
  };

  const handleUpdateShares = async (symbol, value) => {
    if (!session) return;
    const parsed = Number.parseFloat(value);
    const nextShares = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;

    try {
        const { error } = await supabase
            .from('portfolios')
            .update({ shares: nextShares })
            .eq('user_id', session.user.id)
            .eq('symbol', symbol);

        if (error) throw error;

        setHoldings((prev) =>
            prev.map((holding) =>
                holding.symbol === symbol ? { ...holding, shares: nextShares } : holding
            )
        );
    } catch (err) {
        console.error("Error updating shares:", err);
    }
  };

  const handleRemoveStock = async (symbol) => {
    if (!session) return;
    try {
        const { error } = await supabase
            .from('portfolios')
            .delete()
            .eq('user_id', session.user.id)
            .eq('symbol', symbol);

        if (error) throw error;

        setHoldings((prev) => prev.filter((holding) => holding.symbol !== symbol));
    } catch (err) {
        console.error("Error removing stock:", err);
    }
  };

  const handleBuyingPowerChange = async (value) => {
    if (!session) return;
    const parsed = Number.parseFloat(value);
    const newVal = Number.isFinite(parsed) ? Math.max(0, parsed) : 9;

    try {
        const { error } = await supabase
            .from('user_settings')
            .upsert({ user_id: session.user.id, buying_power: newVal });

        if (error) throw error;
        
        setBuyingPower(newVal);
    } catch (err) {
        console.error("Error updating buying power:", err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 5. Import / Export Logic
  const handleExport = () => {
    const data = {
        buyingPower,
        holdings: holdings.map(h => ({ symbol: h.symbol, shares: h.shares }))
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("WARNING: importing will DELETE all current data and replace it with the file contents. Are you sure?")) {
        event.target.value = null; // Reset input
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data.holdings) || typeof data.buyingPower !== 'number') {
                throw new Error("Invalid Format");
            }

            // Batch Wipe & Replace
            setLoadingConfig(true);

            // 1. Delete all portfolios
            await supabase.from('portfolios').delete().eq('user_id', session.user.id);
            // 2. Insert new portfolios
            const newPortfolios = data.holdings.map(h => ({
                user_id: session.user.id,
                symbol: h.symbol,
                shares: h.shares
            }));
            
            if (newPortfolios.length > 0) {
                 await supabase.from('portfolios').insert(newPortfolios);
            }

            // 3. Update Buying Power
            await supabase.from('user_settings').upsert({ 
                user_id: session.user.id, 
                buying_power: data.buyingPower 
            });

            // Reload
            await fetchUserData();
            event.target.value = null; // Reset input

        } catch (err) {
            console.error(err);
            alert("Import failed. Check file format.");
        } finally {
            setLoadingConfig(false);
        }
    };
    reader.readAsText(file);
  };


  if (loadingConfig) {
     return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading...</div>;
  }

  if (!session) {
    return <Auth />;
  }

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
          userEmail={session.user.email}
          onLogout={handleLogout}
          onExport={handleExport}
          onImport={handleImport}
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
