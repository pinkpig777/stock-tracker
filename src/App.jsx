import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from './supabaseClient';
import { usePortfolioData } from './hooks/usePortfolioData';
import { Header } from './components/Header';
import { AddStockForm } from './components/AddStockForm';
import { HoldingsTable } from './components/HoldingsTable';
import { AllocationChart } from './components/AllocationChart';
import { Auth } from './components/Auth';
import { Loader2 } from 'lucide-react';

// API Configuration
const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const API_BASE = 'https://finnhub.io/api/v1/quote';

function App() {
  const [session, setSession] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [buyingPower, setBuyingPower] = useState(0);
  const [history, setHistory] = useState([]); 
  const [loadingConfig, setLoadingConfig] = useState(true);

  const lastSnapshotRef = useRef(null);
  const holdingsRef = useRef(holdings);
  const buyingPowerRef = useRef(buyingPower);

  // 1. Auth & Initial Load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error checking session:", error);
      }
      setSession(session);
      if (session) fetchUserData();
      setLoadingConfig(false);
    }).catch(err => {
      console.error("Critical Auth Error:", err);
      setLoadingConfig(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
         fetchUserData();
      } else {
        setHoldings([]);
        setBuyingPower(0);
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
      toast.error('Failed to load portfolio data');
    }
  };

  // 2. Data Sync
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

  const { prices, loading, lastUpdated, error: usePortfolioError, refetch } = usePortfolioData(symbolsKey, {
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

  // 4. Actions (Safe Validation)
  const validateSymbol = async (symbol) => {
     try {
       const res = await fetch(`${API_BASE}?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`);
       if (!res.ok) throw new Error('API Error');
       const data = await res.json();
       // Finnhub returns {c: 0, ...} if invalid usually, or just empty. 
       // We strictly want data.c > 0.
       return data.c > 0;
     } catch (err) {
       console.error(err);
       return false;
     }
  };

  const handleAddStock = async ({ symbol, shares }) => {
    const safeShares = Number.isFinite(shares) ? Math.max(0, shares) : 0;
    if (!symbol || safeShares <= 0 || !session) return;

    const toastId = toast.loading(`Validating ${symbol}...`);

    try {
        // 1. Validate
        const isValid = await validateSymbol(symbol);
        
        if (!isValid) {
            toast.error(`Invalid Symbol: ${symbol}. Prices unavailable.`, { id: toastId });
            return;
        }

        // 2. Optimistic Update Local
        const existingIndex = holdings.findIndex(h => h.symbol === symbol);
        let newHoldings = [...holdings];
        
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
            toast.success(`Updated ${symbol} (+${safeShares} shares)`, { id: toastId });

        } else {
            // Insert new
            const { data, error } = await supabase
                .from('portfolios')
                .insert([{ user_id: session.user.id, symbol, shares: safeShares }])
                .select()
                .single();
            
            if (error) throw error;
            
            setHoldings(prev => [...prev, { id: data.id, symbol: data.symbol, shares: Number(data.shares) }]);
            toast.success(`Added ${symbol} to portfolio`, { id: toastId });
        }
    } catch (err) {
        console.error("Error adding stock:", err);
        toast.error("Failed to save stock. Please try again.", { id: toastId });
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
        toast.success(`Updated ${symbol} shares`);
    } catch (err) {
        console.error("Error updating shares:", err);
        toast.error("Failed to update shares");
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
        toast.success(`Removed ${symbol}`);
    } catch (err) {
        console.error("Error removing stock:", err);
        toast.error("Failed to remove stock");
    }
  };

  const handleBuyingPowerChange = async (value) => {
    if (!session) return;
    const parsed = Number.parseFloat(value);
    const newVal = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;

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
    a.download = `asset-dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Export successful");
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("WARNING: All existing data will be WIPED and replaced. Continue?")) {
        event.target.value = null; 
        return;
    }

    const toastId = toast.loading("Importing...");

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
            toast.success("Import successful", { id: toastId });
            event.target.value = null; // Reset input

        } catch (err) {
            console.error(err);
            toast.error("Import failed: Invalid file", { id: toastId });
        } finally {
            setLoadingConfig(false);
        }
    };
    reader.readAsText(file);
  };


  if (loadingConfig) {
     return <div className="flex min-h-screen items-center justify-center text-slate-500"><Loader2 className="animate-spin" /></div>;
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 text-slate-900">
      <Toaster position="bottom-right" />
      <div className="pointer-events-none absolute inset-0 bg-dashboard-grid" aria-hidden="true" />
      <div className="pointer-events-none absolute -top-32 -left-24 h-72 w-72 rounded-full bg-gradient-to-br from-blue-200/70 via-sky-200/40 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-96 w-96 rounded-full bg-gradient-to-br from-slate-200/90 via-blue-100/70 to-transparent blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 pb-12 pt-8 md:px-6 md:pt-12">
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

        {usePortfolioError && (
            // This is just the general error from hooks, might be finnhub key missing
            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                Data Error: {usePortfolioError}
            </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content (Left) */}
          <div className="space-y-6 lg:col-span-2">
            <HoldingsTable
              holdings={holdings}
              prices={prices}
              onUpdateShares={handleUpdateShares}
              onRemove={handleRemoveStock}
            />
             <AddStockForm onAdd={handleAddStock} />
          </div>

          {/* Sidebar (Right) */}
          <div className="space-y-6">
            <AllocationChart 
                holdings={holdings} 
                prices={prices} 
                cashValue={buyingPower} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
