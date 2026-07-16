import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { MOCK_ANALYTICS } from '../../mock/mockData';

Chart.register(...registerables);

export default function ResourceHeatmap({ monthlyRevenue: propMonthly, skillDistribution: propSkill }) {
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  
  const barInstance = useRef(null);
  const pieInstance = useRef(null);

  const monthlyRevenue = propMonthly || [];
  const skillDistribution = propSkill || [];

  useEffect(() => {
    if (barChartRef.current) {
      if (barInstance.current) barInstance.current.destroy();
      barInstance.current = new Chart(barChartRef.current, {
        type: 'bar',
        data: {
          labels: monthlyRevenue.map(d => d.name),
          datasets: [
            {
              label: 'Revenue Potential ($)',
              data: monthlyRevenue.map(d => d.revenue),
              backgroundColor: '#00CD80',
              borderRadius: 6,
            },
            {
              label: 'Active Proposals',
              data: monthlyRevenue.map(d => d.proposals),
              backgroundColor: '#3754db',
              borderRadius: 6,
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: {
                color: '#71717a',
                font: { family: 'Inter', size: 11, weight: '500' }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) label += ': ';
                  if (context.datasetIndex === 0) {
                    label += '$' + Number(context.raw || 0).toLocaleString();
                  } else {
                    label += context.raw;
                  }
                  return label;
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { size: 10 } }
            },
            y: {
              grid: { color: '#f1f5f9' },
              ticks: { color: '#94a3b8', font: { size: 10 } }
            }
          }
        }
      });
    }

    if (pieChartRef.current) {
      if (pieInstance.current) pieInstance.current.destroy();
      pieInstance.current = new Chart(pieChartRef.current, {
        type: 'doughnut',
        data: {
          labels: skillDistribution.map(d => d.name),
          datasets: [{
            data: skillDistribution.map(d => d.value),
            backgroundColor: ['#00CD80', '#3754db', '#f59e0b', '#ef4444', '#10b981'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          cutout: '70%'
        }
      });
    }

    return () => {
      if (barInstance.current) barInstance.current.destroy();
      if (pieInstance.current) pieInstance.current.destroy();
    };
  }, [monthlyRevenue, skillDistribution]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* 1. Revenue Chart */}
      <div className="lg:col-span-8 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft">
        <div className="pb-4 border-b border-neutral-100 mb-4">
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Revenue Growth and Deal Conversions</h4>
          <p className="text-sm font-semibold text-neutral-800 mt-0.5 font-display">Monthly summary of pipeline volumes</p>
        </div>
        <div className="h-64 relative">
          <canvas ref={barChartRef} />
        </div>
      </div>

      {/* 2. Skills Distribution */}
      <div className="lg:col-span-4 bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-soft flex flex-col justify-between">
        <div className="pb-4 border-b border-neutral-100 mb-4">
          <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Core Resource Skill Allocation</h4>
          <p className="text-sm font-semibold text-neutral-800 mt-0.5 font-display">Categorization of staff allocation matrix</p>
        </div>

        <div className="h-44 relative flex items-center justify-center mb-4">
          <canvas ref={pieChartRef} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] uppercase font-bold text-neutral-400">Total</span>
            <span className="text-xs font-bold text-neutral-800 font-display">5 Categories</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] font-semibold pt-3 border-t border-neutral-100">
          {skillDistribution.map((item, idx) => {
            const colors = ['#00CD80', '#3754db', '#f59e0b', '#ef4444', '#10b981'];
            return (
              <div key={item.name} className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                <span className="text-neutral-500 truncate">{item.name} ({item.value}%)</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
