import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#2563eb', '#10b981']; // Blue-600, Emerald-500

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const AllocationChart = ({ stockValue, cashValue }) => {
  const safeStockValue = Number.isFinite(stockValue) ? stockValue : 0;
  const safeCashValue = Number.isFinite(cashValue) ? cashValue : 0;
  
  const total = safeStockValue + safeCashValue;
  
  const data = [
    { name: 'Stocks', value: safeStockValue },
    { name: 'Cash', value: safeCashValue },
  ].filter((item) => item.value > 0);

  const getPercentage = (value) => {
    if (total === 0) return '0%';
    return Math.round((value / total) * 100) + '%';
  };

  return (
    <section className="flex flex-col rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-slate-900">Allocation</h3>
        <span className="text-xs font-semibold text-slate-500">Asset Mix</span>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-6 md:grid-cols-2">
        {/* Chart Side */}
        <div className="relative h-[200px] w-full">
            {data.length ? (
                <>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="transparent"
                    >
                        {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value) => currencyFormatter.format(Number(value))}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    />
                    </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Total</span>
                    <span className="font-display text-sm font-semibold text-slate-800">
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
        <div className="flex flex-col justify-center gap-3">
            {data.length > 0 ? (
                 data.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                        <div className="flex items-center gap-3">
                            <div 
                                className="h-3 w-3 rounded-full shadow-sm"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                            />
                            <span className="text-sm font-medium text-slate-700">{item.name}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-semibold text-slate-900">{currencyFormatter.format(item.value)}</span>
                            <span className="text-xs text-slate-500">{getPercentage(item.value)}</span>
                        </div>
                    </div>
                ))
            ) : (
                <div className="text-center text-sm text-slate-400">
                    Add assets to see breakdown
                </div>
            )}
        </div>
      </div>
    </section>
  );
};
