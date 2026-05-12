import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useDepot } from "../context/DepotContext";

type TabType = "prices" | "trend";

const months = ["Nov", "Dec", "Jan", "Feb"];

/**
 * Generate realistic price variations with trends
 */
const generateRealisticVariation = (base: number, trend: number = 0) => {
  let current = base;
  return months.map((month, index) => {
    const trendValue = trend * (index + 1);
    const fluctuation = (Math.random() - 0.5) * 4;
    current = base + trendValue + fluctuation;
    return {
      month,
      value: parseFloat(Math.max(current, 0).toFixed(2)),
    };
  });
};

export default function MarketPriceSection() {
  const { selectedDepot, depotProducts } = useDepot();
  const [activeTab, setActiveTab] = useState<TabType>("prices");

  /* ============== DEPOT-SPECIFIC Calculations ============== */
  const depotMetrics = useMemo(() => {
    const depot = depotProducts[selectedDepot];
    if (!depot) {
      return {
        avgPrices: { PMS: 0, ATK: 0, AGO: 0 },
        totalSoldLiters: { PMS: 0, ATK: 0, AGO: 0 },
        totalRemainingLiters: { PMS: 0, ATK: 0, AGO: 0 },
        totalLiters: { PMS: 0, ATK: 0, AGO: 0 },
      };
    }

    const prices = {
      PMS: parseFloat(depot.PMS.price.replace("$", "").trim()) || 0,
      ATK: parseFloat(depot.ATK.price.replace("$", "").trim()) || 0,
      AGO: parseFloat(depot.AGO.price.replace("$", "").trim()) || 0,
    };

    const soldLiters = { PMS: 0, ATK: 0, AGO: 0 };
    const remainingLiters = { PMS: 0, ATK: 0, AGO: 0 };

    (["PMS", "ATK", "AGO"] as const).forEach((product) => {
      const qtyRaw = depot[product].quantity.trim();
      const [sold, remaining] = qtyRaw.split("/").map((x) => {
        const num = parseInt(x.replace(/[^0-9]/g, ""), 10);
        return isNaN(num) ? 0 : num;
      });

      soldLiters[product] = sold;
      remainingLiters[product] = remaining;
    });

    const totalLiters = {
      PMS: parseFloat((soldLiters.PMS + remainingLiters.PMS).toFixed(2)),
      ATK: parseFloat((soldLiters.ATK + remainingLiters.ATK).toFixed(2)),
      AGO: parseFloat((soldLiters.AGO + remainingLiters.AGO).toFixed(2)),
    };

    return {
      avgPrices: prices,
      totalSoldLiters: {
        PMS: parseFloat(soldLiters.PMS.toFixed(2)),
        ATK: parseFloat(soldLiters.ATK.toFixed(2)),
        AGO: parseFloat(soldLiters.AGO.toFixed(2)),
      },
      totalRemainingLiters: {
        PMS: parseFloat(remainingLiters.PMS.toFixed(2)),
        ATK: parseFloat(remainingLiters.ATK.toFixed(2)),
        AGO: parseFloat(remainingLiters.AGO.toFixed(2)),
      },
      totalLiters,
    };
  }, [selectedDepot, depotProducts]);

  /* ============== Chart Data ============== */
  const buildChartData = (basePrices: Record<string, number>, trends: Record<string, number> = {}) => {
    const pmsVariation = generateRealisticVariation(basePrices.PMS, trends.PMS ?? 0);
    const atkVariation = generateRealisticVariation(basePrices.ATK, trends.ATK ?? 0);
    const agoVariation = generateRealisticVariation(basePrices.AGO, trends.AGO ?? 0);

    return months.map((month, i) => ({
      month,
      PMS: pmsVariation[i].value,
      ATK: atkVariation[i].value,
      AGO: agoVariation[i].value,
    }));
  };

  const trends = { PMS: 0.5, ATK: -0.3, AGO: 0.4 };
  const chartData = buildChartData(depotMetrics.avgPrices, trends);

  return (
    <div className="w-full">
      <div className="w-full bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        {/* Header with Tabs */}
        <div className="bg-gradient-to-r from-orange-700 via-orange-500 to-orange-300 px-4 py-1.5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">
              {activeTab === "prices" ? "Price Data" : "Trend Data"} - {selectedDepot}
            </h3>
            
            {/* Tab Switcher */}
            <div className="flex bg-white/20 rounded-lg p-1 backdrop-blur-sm">
              <button
                onClick={() => setActiveTab("prices")}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-300 ${
                  activeTab === "prices"
                    ? "bg-white text-orange-600 shadow-md"
                    : "text-white hover:bg-white/10"
                }`}
              >
                📊 Prices
              </button>
              <button
                onClick={() => setActiveTab("trend")}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all duration-300 ${
                  activeTab === "trend"
                    ? "bg-white text-orange-600 shadow-md"
                    : "text-white hover:bg-white/10"
                }`}
              >
                📈 Trend
              </button>
            </div>
          </div>
        </div>

        {/* Content Area with Sliding Animation */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: activeTab === "prices" ? "translateX(0%)" : "translateX(-100%)",
            }}
          >
            {/* Market Prices Tab */}
            <div className="w-full flex-shrink-0 p-2 h-full">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {/* PMS Card */}
                <div className="bg-white rounded-lg border-l-4 border-red-500 p-1.5 shadow-sm hover:shadow-md transition-shadow">
                  <h5 className="text-sm font-bold text-red-600 mb-0.5 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    PMS (Petrol)
                  </h5>
                  <div className="space-y-0.5 text-sm relative overflow-hidden">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Price</span>
                      <span className="font-bold text-gray-800">${depotMetrics.avgPrices.PMS.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Sold (L)</span>
                      <span className="font-bold text-gray-800">{depotMetrics.totalSoldLiters.PMS.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Remaining (L)</span>
                      <span className="font-bold text-gray-800">{depotMetrics.totalRemainingLiters.PMS.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-0.5 flex justify-between py-2">
                      <span className="text-gray-600 font-semibold">Total (L)</span>
                      <span className="font-bold text-red-600">{depotMetrics.totalLiters.PMS.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* ATK Card */}
                <div className="bg-white rounded-lg border-l-4 border-green-500 p-1.5 shadow-sm hover:shadow-md transition-shadow">
                  <h5 className="text-sm font-bold text-green-600 mb-0.5 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    ATK (Jet Fuel)
                  </h5>
                  <div className="space-y-0.5 text-sm">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Price</span>
                      <span className="font-bold text-gray-800">${depotMetrics.avgPrices.ATK.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Sold (L)</span>
                      <span className="font-bold text-gray-800">{depotMetrics.totalSoldLiters.ATK.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Remaining (L)</span>
                      <span className="font-bold text-gray-800">{depotMetrics.totalRemainingLiters.ATK.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-0.5 flex justify-between py-2">
                      <span className="text-gray-600 font-semibold">Total (L)</span>
                      <span className="font-bold text-green-600">{depotMetrics.totalLiters.ATK.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* AGO Card */}
                <div className="bg-white rounded-lg border-l-4 border-blue-500 p-1.5 shadow-sm hover:shadow-md transition-shadow h-full">
                  <h5 className="text-sm font-bold text-blue-600 mb-0.5 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    AGO (Diesel)
                  </h5>
                  <div className="space-y-0.5 text-sm">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Price</span>
                      <span className="font-bold text-gray-800">${depotMetrics.avgPrices.AGO.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Sold (L)</span>
                      <span className="font-bold text-gray-800">{depotMetrics.totalSoldLiters.AGO.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Remaining (L)</span>
                      <span className="font-bold text-gray-800">{depotMetrics.totalRemainingLiters.AGO.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-0.5 flex justify-between py-2">
                      <span className="text-gray-600 font-semibold">Total (L)</span>
                      <span className="font-bold text-blue-600">{depotMetrics.totalLiters.AGO.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Trend Tab */}
            <div className="w-full flex-shrink-0 p-2">
              <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-200">
                <h4 className="text-sm font-bold text-gray-800 mb-0.5">4 Month Price Trend</h4>
                
                {/* Compact Legend */}
                <div className="grid grid-cols-3 gap-2 mb-1">
                  <div className="flex items-center gap-2 p-1 bg-red-50 rounded text-xs">
                    <div className="w-3 h-3 bg-red-500 rounded" />
                    <span className="font-semibold text-gray-700">PMS</span>
                  </div>
                  <div className="flex items-center gap-2 p-1 bg-green-50 rounded text-xs">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    <span className="font-semibold text-gray-700">ATK</span>
                  </div>
                  <div className="flex items-center gap-2 p-1 bg-blue-50 rounded text-xs">
                    <div className="w-3 h-3 bg-blue-500 rounded" />
                    <span className="font-semibold text-gray-700">AGO</span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={167}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 20, left: -10, bottom: 3 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="#6b7280"
                      style={{ fontSize: "12px" }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      style={{ fontSize: "12px" }}
                      width={40}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "10px",
                        fontSize: "12px",
                      }}
                      formatter={(value: any) => `$${value.toFixed(2)}`}
                    />
                    <Bar dataKey="PMS" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ATK" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="AGO" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}