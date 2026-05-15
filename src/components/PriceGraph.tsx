import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

const FALLBACK_PRICE_HISTORY = [
  { month: 'January 2026', monthShort: 'Jan', pms: 1280, atk: 1350, ago: 1720 },
  { month: 'February 2026', monthShort: 'Feb', pms: 1295, atk: 1360, ago: 1745 },
  { month: 'March 2026', monthShort: 'Mar', pms: 1310, atk: 1375, ago: 1760 },
  { month: 'April 2026', monthShort: 'Apr', pms: 1330, atk: 1390, ago: 1780 },
];

const E_NERGY_SALES_HISTORY = [
  { monthShort: 'Jan', pmsSold: 145000, atkSold: 68000, agoSold: 112000, pmsRemaining: 220000, atkRemaining: 105000, agoRemaining: 185000 },
  { monthShort: 'Feb', pmsSold: 158000, atkSold: 72000, agoSold: 118000, pmsRemaining: 207000, atkRemaining: 101000, agoRemaining: 179000 },
  { monthShort: 'Mar', pmsSold: 162000, atkSold: 75000, agoSold: 121000, pmsRemaining: 195000, atkRemaining: 97000, agoRemaining: 174000 },
  { monthShort: 'Apr', pmsSold: 170000, atkSold: 78000, agoSold: 126000, pmsRemaining: 182000, atkRemaining: 93000, agoRemaining: 168000 },
];

interface PriceGraphProps {
  isOpen: boolean;
  onClose: () => void;
  activeRow?: 'energy' | 'africa' | 'global' | null;
}

/**
 * Determines price trend direction (up/down/stable)
 */
const getPriceTrend = (current: number, previous: number): { direction: 'up' | 'down' | 'stable'; percentage: number } => {
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.5) return { direction: 'stable', percentage: 0 };
  return {
    direction: change > 0 ? 'up' : 'down',
    percentage: Math.abs(change),
  };
};

/**
 * Format large numbers with commas
 */
const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

export const PriceGraph: React.FC<PriceGraphProps> = ({ isOpen, onClose, activeRow }) => {
  const [priceHistory, setPriceHistory] = useState(FALLBACK_PRICE_HISTORY);
  const eNergySalesHistory = E_NERGY_SALES_HISTORY;
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  useEffect(() => {
    if (!isOpen) return;
    import("@/lib/db-client").then(({ api }) => {
      api.priceHistory.list({ limit: 12 }).then((r: any) => {
        if (r?.data?.length >= 2) {
          setPriceHistory(r.data.map((e: any) => ({
            month:      e.month      ?? "",
            monthShort: e.monthShort ?? "",
            pms: e.pms ?? 0,
            atk: e.atk ?? 0,
            ago: e.ago ?? 0,
          })));
        }
      }).catch(() => null);
    }).catch(() => null);
  }, [isOpen]);

  // Calculate e-Nergy prices
  const eNergyHistory = priceHistory.map(entry => ({
    ...entry,
    pms: Math.round((entry.pms * 0.98) * 100) / 100,
    atk: Math.round((entry.atk * 0.97) * 100) / 100,
    ago: Math.round((entry.ago * 0.99) * 100) / 100,
  }));

  // Get data based on active row
  const getGraphData = () => {
    switch (activeRow) {
      case 'energy':
        return {
          title: 'e-Nergy Price Trends',
          subtitle: 'Company-wide pricing across all depots',
          history: eNergyHistory,
          color: 'from-purple-600 to-purple-400',
          accentColor: 'text-purple-600',
          badgeColor: 'bg-purple-100 text-purple-700',
        };
      case 'africa':
        return {
          title: 'Africa Regional Averages',
          subtitle: 'Market pricing across African depots',
          history: priceHistory,
          color: 'from-blue-600 to-blue-400',
          accentColor: 'text-blue-600',
          badgeColor: 'bg-blue-100 text-blue-700',
        };
      case 'global':
        return {
          title: 'World Market Prices',
          subtitle: 'Global crude oil pricing benchmarks',
          history: priceHistory.map(entry => ({
            ...entry,
            pms: Math.round((entry.pms * 1.05) * 100) / 100,
            atk: Math.round((entry.atk * 1.06) * 100) / 100,
            ago: Math.round((entry.ago * 1.04) * 100) / 100,
          })),
          color: 'from-indigo-600 to-indigo-400',
          accentColor: 'text-indigo-600',
          badgeColor: 'bg-indigo-100 text-indigo-700',
        };
      default:
        return null;
    }
  };

  const graphData = getGraphData();
  if (!graphData) return null;

  // Calculate stats
  const currentMonth = priceHistory[priceHistory.length - 1];
  const previousMonth = priceHistory[priceHistory.length - 2];

  const pmsTrend = getPriceTrend(currentMonth.pms, previousMonth.pms);
  const atkTrend = getPriceTrend(currentMonth.atk, previousMonth.atk);
  const agoTrend = getPriceTrend(currentMonth.ago, previousMonth.ago);

  // Render chart based on type
  const renderChart = () => {
    if (chartType === 'line') {
      return <LineChart data={graphData.history} />;
    } else {
      return <BarChart data={graphData.history} />;
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Slide Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full sm:w-[90%] md:w-[750px] lg:w-[900px] bg-white z-50
          transform transition-transform duration-500 ease-in-out shadow-2xl
          overflow-y-auto
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${graphData.color} sticky top-0 z-50 px-4 sm:px-8 py-6 sm:py-8 flex items-center justify-between`}>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">{graphData.title}</h2>
            <p className="text-sm sm:text-base text-white/90 mt-1">{graphData.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-8 space-y-8">
          {/* Chart Type Toggle */}
          <div className="flex gap-3 justify-center sm:justify-start">
            <button
              onClick={() => setChartType('line')}
              className={`px-4 sm:px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                chartType === 'line'
                  ? `${graphData.badgeColor}`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Line Chart
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-4 sm:px-6 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                chartType === 'bar'
                  ? `${graphData.badgeColor}`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Bar Chart
            </button>
          </div>

          {/* Chart */}
          <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200">
            {renderChart()}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard
              product="PMS"
              currentPrice={currentMonth.pms}
              trend={pmsTrend}
              color="bg-red-50 border-red-200"
              textColor="text-red-600"
            />
            <StatsCard
              product="ATK"
              currentPrice={currentMonth.atk}
              trend={atkTrend}
              color="bg-green-50 border-green-200"
              textColor="text-green-600"
            />
            <StatsCard
              product="AGO"
              currentPrice={currentMonth.ago}
              trend={agoTrend}
              color="bg-blue-50 border-blue-200"
              textColor="text-blue-600"
            />
          </div>

          {/* e-Nergy Sales Data */}
          {activeRow === 'energy' && eNergySalesHistory && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800">e-Nergy Inventory Tracking</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300 bg-gray-50">
                      <th className="px-4 py-3 text-left font-bold text-gray-700">Month</th>
                      <th className="px-4 py-3 text-center font-bold text-red-600">PMS Sold</th>
                      <th className="px-4 py-3 text-center font-bold text-green-600">ATK Sold</th>
                      <th className="px-4 py-3 text-center font-bold text-blue-600">AGO Sold</th>
                      <th className="px-4 py-3 text-center font-bold text-gray-600">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eNergySalesHistory.map((sale, idx) => {
                      const totalRemaining = sale.pmsRemaining + sale.atkRemaining + sale.agoRemaining;
                      return (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold text-gray-800">{sale.monthShort}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{formatNumber(sale.pmsSold)}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{formatNumber(sale.atkSold)}</td>
                          <td className="px-4 py-3 text-center text-gray-700">{formatNumber(sale.agoSold)}</td>
                          <td className="px-4 py-3 text-center font-semibold text-gray-800">
                            {formatNumber(totalRemaining)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/* ============================================ STATS CARD ============================================ */
interface StatsCardProps {
  product: string;
  currentPrice: number;
  trend: { direction: 'up' | 'down' | 'stable'; percentage: number };
  color: string;
  textColor: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ product, currentPrice, trend, color, textColor }) => {
  return (
    <div className={`${color} border rounded-lg p-4`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase">Current {product}</p>
          <p className={`text-2xl sm:text-3xl font-bold ${textColor} mt-2`}>₦{currentPrice.toLocaleString()}/L</p>
        </div>
        <div className="flex flex-col items-end">
          {trend.direction === 'up' ? (
            <TrendingUp className={`${textColor} w-5 h-5`} />
          ) : trend.direction === 'down' ? (
            <TrendingDown className={`${textColor} w-5 h-5`} />
          ) : (
            <div className={`${textColor} w-5 h-5 border-2 rounded-full`} />
          )}
          <p className={`text-xs font-bold mt-1 ${textColor}`}>
            {trend.percentage > 0 ? '+' : ''}{trend.percentage.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
};

/* ============================================ LINE CHART ============================================ */
interface ChartData {
  month: string;
  monthShort: string;
  pms: number;
  atk: number;
  ago: number;
}

const LineChart: React.FC<{ data: ChartData[] }> = ({ data }) => {
  const minPrice = Math.min(...data.flatMap(d => [d.pms, d.atk, d.ago])) - 2;
  const maxPrice = Math.max(...data.flatMap(d => [d.pms, d.atk, d.ago])) + 2;
  const range = maxPrice - minPrice;

  const getY = (price: number) => {
    return ((maxPrice - price) / range) * 200 + 20;
  };

  const getX = (index: number) => {
    return (index / (data.length - 1)) * 500 + 40;
  };

  const pmsPath = data.map((d, i) => `${getX(i)},${getY(d.pms)}`).join(' L ');
  const atkPath = data.map((d, i) => `${getX(i)},${getY(d.atk)}`).join(' L ');
  const agoPath = data.map((d, i) => `${getX(i)},${getY(d.ago)}`).join(' L ');

  return (
    <div className="w-full overflow-x-auto">
      <svg width="600" height="280" viewBox="0 0 600 280" className="mx-auto">
        {/* Grid */}
        {[0, 1, 2, 3, 4].map(i => (
          <line
            key={`h-${i}`}
            x1="40"
            y1={20 + (i * 50)}
            x2="550"
            y2={20 + (i * 50)}
            stroke="#e5e7eb"
            strokeDasharray="4"
          />
        ))}

        {/* Y-axis */}
        <line x1="40" y1="20" x2="40" y2="220" stroke="#6b7280" strokeWidth="2" />
        {/* X-axis */}
        <line x1="40" y1="220" x2="550" y2="220" stroke="#6b7280" strokeWidth="2" />

        {/* Y-axis labels */}
        {[0, 1, 2, 3, 4].map(i => {
          const price = Math.round(maxPrice - (i * range) / 4);
          return (
            <text
              key={`label-${i}`}
              x="35"
              y={25 + i * 50}
              textAnchor="end"
              className="text-xs fill-gray-600"
            >
              ₦{price.toLocaleString()}
            </text>
          );
        })}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text
            key={`month-${i}`}
            x={getX(i)}
            y="240"
            textAnchor="middle"
            className="text-xs fill-gray-600 font-semibold"
          >
            {d.monthShort}
          </text>
        ))}

        {/* PMS Line */}
        <polyline
          points={pmsPath}
          fill="none"
          stroke="#ef4444"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => (
          <circle key={`pms-${i}`} cx={getX(i)} cy={getY(d.pms)} r="4" fill="#ef4444" />
        ))}

        {/* ATK Line */}
        <polyline
          points={atkPath}
          fill="none"
          stroke="#22c55e"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => (
          <circle key={`atk-${i}`} cx={getX(i)} cy={getY(d.atk)} r="4" fill="#22c55e" />
        ))}

        {/* AGO Line */}
        <polyline
          points={agoPath}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {data.map((d, i) => (
          <circle key={`ago-${i}`} cx={getX(i)} cy={getY(d.ago)} r="4" fill="#3b82f6" />
        ))}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-red-500 rounded" />
          <span className="font-semibold text-gray-700">PMS</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-green-500 rounded" />
          <span className="font-semibold text-gray-700">ATK</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-blue-500 rounded" />
          <span className="font-semibold text-gray-700">AGO</span>
        </div>
      </div>
    </div>
  );
};

/* ============================================ BAR CHART ============================================ */
const BarChart: React.FC<{ data: ChartData[] }> = ({ data }) => {
  const minPrice = Math.min(...data.flatMap(d => [d.pms, d.atk, d.ago])) - 2;
  const maxPrice = Math.max(...data.flatMap(d => [d.pms, d.atk, d.ago])) + 2;
  const range = maxPrice - minPrice;

  const getHeight = (price: number) => {
    return ((price - minPrice) / range) * 150;
  };

  const barWidth = 45;
  const groupSpacing = 90;

  return (
    <div className="w-full overflow-x-auto">
      <svg width="600" height="280" viewBox="0 0 600 280" className="mx-auto">
        {/* Grid */}
        {[0, 1, 2, 3].map(i => (
          <line
            key={`h-${i}`}
            x1="40"
            y1={220 - (i * 50)}
            x2="550"
            y2={220 - (i * 50)}
            stroke="#e5e7eb"
            strokeDasharray="4"
          />
        ))}

        {/* Y-axis */}
        <line x1="40" y1="20" x2="40" y2="220" stroke="#6b7280" strokeWidth="2" />
        {/* X-axis */}
        <line x1="40" y1="220" x2="550" y2="220" stroke="#6b7280" strokeWidth="2" />

        {/* Y-axis labels */}
        {[0, 1, 2, 3].map(i => {
          const price = Math.round(minPrice + (i * range) / 3);
          return (
            <text
              key={`label-${i}`}
              x="35"
              y={225 - i * 50}
              textAnchor="end"
              className="text-xs fill-gray-600"
            >
              ₦{price.toLocaleString()}
            </text>
          );
        })}

        {/* Bars */}
        {data.map((d, monthIdx) => {
          const startX = 60 + monthIdx * groupSpacing;
          const barData = [
            { price: d.pms, fill: '#ef4444' },
            { price: d.atk, fill: '#22c55e' },
            { price: d.ago, fill: '#3b82f6' },
          ];

          return (
            <g key={`month-${monthIdx}`}>
              {barData.map((bar, barIdx) => (
                <rect
                  key={`bar-${monthIdx}-${barIdx}`}
                  x={startX + barIdx * 15 - barWidth / 2}
                  y={220 - getHeight(bar.price)}
                  width={12}
                  height={getHeight(bar.price)}
                  fill={bar.fill}
                  rx="2"
                />
              ))}
              <text
                x={startX + 5}
                y="240"
                textAnchor="middle"
                className="text-xs fill-gray-600 font-semibold"
              >
                {d.monthShort}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span className="font-semibold text-gray-700">PMS</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="font-semibold text-gray-700">ATK</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="font-semibold text-gray-700">AGO</span>
        </div>
      </div>
    </div>
  );
};

export default PriceGraph;
