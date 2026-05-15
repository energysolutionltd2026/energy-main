import React, { useState, useEffect } from 'react';

interface PriceComparisonTableProps {
  onRowClick?: (rowType: 'energy' | 'africa' | 'global') => void;
  activeRow?: 'energy' | 'africa' | 'global' | null;
}

export const PriceComparisonTable: React.FC<PriceComparisonTableProps> = ({
  onRowClick,
  activeRow
}) => {
  const [prices, setPrices] = useState({ pms: 1330, atk: 1390, ago: 1780 });

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => api.platformSettings.get()).then((s) => {
      if (!s) return;
      setPrices({
        pms: s.pmsPricePerLitre || 1330,
        atk: s.atkPricePerLitre || 1390,
        ago: s.agoPricePerLitre || 1780,
      });
    }).catch(() => null);
  }, []);

  const rows = [
    {
      id: 'energy',
      label: 'e-Nergy',
      pms: prices.pms,
      atk: prices.atk,
      ago: prices.ago,
      badge: 'Company',
      badgeColor: 'bg-purple-500',
    },
  ];

  return (
    <div className="w-full bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white">Real-Time Price Comparison</h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">Current Month: {new Date().toLocaleString("en-NG", { month: "long", year: "numeric" })}</p>
          </div>
          <div className="text-right">
            <p className="text-xs sm:text-sm font-semibold text-orange-400">All prices in ₦/Liter</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="p-3 sm:p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-300">
                <th className="px-2 sm:px-4 py-3 sm:py-4 text-left font-bold text-xs sm:text-sm text-slate-700">
                  Market
                </th>
                <th className="px-2 sm:px-4 py-3 sm:py-4 text-center font-bold text-xs sm:text-sm text-red-600">
                  PMS
                </th>
                <th className="px-2 sm:px-4 py-3 sm:py-4 text-center font-bold text-xs sm:text-sm text-green-600">
                  ATK
                </th>
                <th className="px-2 sm:px-4 py-3 sm:py-4 text-center font-bold text-xs sm:text-sm text-blue-600">
                  AGO
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.id as any)}
                  className={`
                    border-b border-slate-200 cursor-pointer transition-all duration-300
                    ${
                      activeRow === row.id
                        ? 'bg-slate-100 shadow-inner'
                        : 'hover:bg-slate-50'
                    }
                  `}
                >
                  <td className="px-2 sm:px-4 py-4 sm:py-5">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="font-bold text-sm sm:text-base text-slate-900">
                        {row.label}
                      </span>
                      <span className={`${row.badgeColor} text-white text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-semibold`}>
                        {row.badge}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-4 sm:py-5 text-center">
                    <span className="font-bold text-sm sm:text-base text-slate-800">
                      ₦{row.pms.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-2 sm:px-4 py-4 sm:py-5 text-center">
                    <span className="font-bold text-sm sm:text-base text-slate-800">
                      ₦{row.atk.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-2 sm:px-4 py-4 sm:py-5 text-center">
                    <span className="font-bold text-sm sm:text-base text-slate-800">
                      ₦{row.ago.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note */}
      <div className="bg-slate-50 px-4 sm:px-6 py-3 border-t border-slate-200">
        <p className="text-xs text-slate-600">
          💡 Click on any row to view 4-month price trends and detailed analytics
        </p>
      </div>
    </div>
  );
};

export default PriceComparisonTable;
