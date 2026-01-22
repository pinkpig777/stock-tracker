import { useState, useEffect, useCallback, useMemo } from 'react';

const FINNHUB_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const API_BASE = 'https://finnhub.io/api/v1/quote';

const normalizeSymbols = (symbols = []) => {
  const unique = new Set();
  symbols.forEach((symbol) => {
    if (typeof symbol !== 'string') {
      return;
    }
    const trimmed = symbol.trim().toUpperCase();
    if (trimmed) {
      unique.add(trimmed);
    }
  });
  return Array.from(unique);
};

export const usePortfolioData = (symbolsKey = '', options = {}) => {
  const { onPricesUpdate } = options;
  const symbols = useMemo(() => {
    if (!symbolsKey) {
      return [];
    }
    return normalizeSymbols(symbolsKey.split('|'));
  }, [symbolsKey]);

  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const fetchPrices = useCallback(async () => {
    if (!FINNHUB_KEY) {
      setLoading(false);
      setError('Missing Finnhub API key');
      return;
    }

    if (symbols.length === 0) {
      setPrices({});
      setLastUpdated(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const responses = await Promise.allSettled(
        symbols.map(async (symbol) => {
          const res = await fetch(
            `${API_BASE}?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_KEY}`
          );
          if (!res.ok) {
            throw new Error(`Quote failed for ${symbol}`);
          }
          const data = await res.json();
          return { symbol, price: Number.isFinite(data.c) ? data.c : 0 };
        })
      );

      const nextPrices = {};
      let failures = 0;

      responses.forEach((response) => {
        if (response.status === 'fulfilled') {
          nextPrices[response.value.symbol] = response.value.price;
        } else {
          failures += 1;
        }
      });

      let mergedPrices = {};
      setPrices((prev) => {
        mergedPrices = { ...prev, ...nextPrices };
        return mergedPrices;
      });
      const timestamp = Date.now();
      setLastUpdated(timestamp);
      setError(failures ? 'Some quotes failed to load' : null);
      if (typeof onPricesUpdate === 'function') {
        onPricesUpdate({ timestamp, prices: mergedPrices });
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  }, [symbols, onPricesUpdate]);

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, 60000);
    return () => clearInterval(id);
  }, [fetchPrices]);

  return { prices, loading, lastUpdated, error, refetch: fetchPrices };
};
