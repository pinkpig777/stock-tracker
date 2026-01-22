import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const AllocationChart = ({ holdings = [], prices = {}, cashValue = 0 }) => {
  const safeCashValue = Number.isFinite(cashValue) ? Math.max(0, cashValue) : 0;

  // 1. Transform Holdings to Chart Data
  const stockData = holdings.map((holding) => {
    const price = prices[holding.symbol] || 0;
    const value = price * holding.shares;
    return {
      name: holding.symbol,
      value: value,
      isCash: false,
    };
  });

  // 2. Add Cash & Filter Zero Values
  const rawData = [
    ...stockData,
    { name: 'Cash', value: safeCashValue, isCash: true },
  ].filter((item) => item.value > 0);

  // 3. Sort by Value (Desc)
  const data = rawData.sort((a, b) => b.value - a.value);

  // Calculate Total for Percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const getPercentage = (value) => {
    if (total === 0) return '0.0%';
    return ((value / total) * 100).toFixed(1) + '%';
  };

  // Assign Colors (Cash gets specific gray if preferred, or just next in rotation)
  // Requirement said: "Exception: Ensure 'Cash' always has a distinct, recognizable color (e.g., #d1d5db or Gray), or just include it in the rotation if preferred."
  // I will use a distinct Gray for Cash to be safe/professional.
  const getFillColor = (entry, index) => {
    if (entry.name === 'Cash') return '#9ca3af'; // gray-400
    return COLORS[index % COLORS.length];
  };

  return (

    <section className="flex flex-col rounded-2xl border border-slate-200/70 bg-white/90 p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-slate-900">Allocation</h3>
        <span className="text-xs font-semibold text-slate-500">Asset Mix</span>
      </div>

      <div className="flex flex-col gap-8">
        {/* Chart Side */}
        <div className="relative h-[260px] w-full">
            {data.length ? (
                <>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="transparent"
                    >
                        {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getFillColor(entry, index)} />
                        ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value) => currencyFormatter.format(Number(value))}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    />
                    </PieChart>
                </ResponsiveContainer>
                
                {/* Center Label */}
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Total</span>
                    <span className="font-display text-xl font-semibold text-slate-800">
                    {currencyFormatter.format(total)}
                    </span>
                 </div>
                </>
            ) : (
                <div className="flex h-full items-center justify-center rounded-full border border-dashed border-slate-200 text-xs text-slate-400">
                    No Data
                </div>
            )}
        </div>

        {/* Legend Side */}
        <div className="flex w-full flex-col gap-3">
             {data.length > 0 ? (
                 data.map((item, index) => (
                    <div key={item.name} className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/30 p-3 transition-all hover:bg-slate-50 hover:shadow-sm">
                        <div className="flex items-center gap-3">
                            <div 
                                className="h-3 w-3 rounded-full ring-2 ring-white"
                                style={{ backgroundColor: getFillColor(item, index) }} 
                            />
                            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{item.name}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="font-display text-sm font-semibold text-slate-900">{currencyFormatter.format(item.value)}</span>
                            <span className="text-xs text-slate-500">{getPercentage(item.value)}</span>
                        </div>
                    </div>
                ))
            ) : (
                <div className="py-8 text-center text-sm text-slate-400">
                    Add assets to see breakdown
                </div>
            )}
        </div>
      </div>
    </section>
  );
};
