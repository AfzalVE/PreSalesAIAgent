import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const COLORS = ['#00CD80', '#3754db', '#f59e0b', '#10b981', '#6366f1'];

export default function BudgetChart({ budget }) {
  const data = [
    { name: 'Frontend Engineering', value: Math.round(budget * 0.35) },
    { name: 'Backend Engineering', value: Math.round(budget * 0.25) },
    { name: 'UI/UX Design', value: Math.round(budget * 0.15) },
    { name: 'Project Delivery', value: Math.round(budget * 0.10) },
    { name: 'Cloud Infrastructure', value: Math.round(budget * 0.15) }
  ];

  return (
    <div className="w-full bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft flex flex-col justify-between">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Budget Allocation Breakdown</h4>
        <span className="text-2xl font-bold font-display tracking-tight text-neutral-900 block">
          ${budget.toLocaleString()}
        </span>
      </div>

      <div className="h-44 relative mt-2 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={65}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`$${value.toLocaleString()}`, 'Allocation']}
              contentStyle={{ background: '#1e2022', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-bold text-neutral-400">Total</span>
          <span className="text-sm font-semibold text-neutral-800">${Math.round(budget / 1000)}k</span>
        </div>
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs mt-3 pt-3 border-t border-neutral-100">
        {data.map((item, idx) => (
          <div key={item.name} className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
            <span className="text-neutral-500 font-medium truncate" title={item.name}>{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
