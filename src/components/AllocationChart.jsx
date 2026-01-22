import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#2563eb', '#10b981'];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export const AllocationChart = ({ stockValue, cashValue }) => {
  const safeStockValue = Number.isFinite(stockValue) ? stockValue : 0;
  const safeCashValue = Number.isFinite(cashValue) ? cashValue : 0;
  const data = [
    { name: 'Stocks', value: safeStockValue },
    { name: 'Cash', value: safeCashValue },
  ].filter((item) => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold text-slate-900">Allocation</h3>
        <span className="text-xs font-semibold text-slate-500">Stocks vs Cash</span>
      </div>

      {data.length ? (
        <div className="relative mt-6 h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="48%"
                innerRadius={70}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
                stroke="transparent"
              >
                {data.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => currencyFormatter.format(Number(value))} />
              <Legend verticalAlign="bottom" height={32} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs uppercase tracking-[0.2em] text-slate-400">Total</span>
            <span className="font-display text-lg font-semibold text-slate-800">
              {currencyFormatter.format(total)}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-500">
          Allocation appears once prices load.
        </div>
      )}
    </section>
  );
};
