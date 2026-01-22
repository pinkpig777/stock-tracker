import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
});

export const GrowthChart = ({ history }) => {
  const data = useMemo(() => {
    if (!Array.isArray(history)) {
      return [];
    }
    return history.map((entry) => ({
      time: timeFormatter.format(new Date(entry.timestamp)),
      totalValue: entry.totalValue,
    }));
  }, [history]);

  const hasData = data.length > 1;

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold text-slate-900">Net Worth Trend</h3>
          <p className="text-xs text-slate-500">
            Auto-snapshots on each price refresh.
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
          {data.length} points
        </span>
      </div>

      {hasData ? (
        <div className="mt-6 h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => compactFormatter.format(value)}
              />
              <Tooltip formatter={(value) => currencyFormatter.format(Number(value))} />
              <Area
                type="monotone"
                dataKey="totalValue"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#netWorthGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-6 flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500">
          History appears after the next price refresh.
        </div>
      )}
    </section>
  );
};
