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
const generateRealisticVariation = (base: number, trendPct: number = 0) => {
  return months.map((_, index) => {
    const trendValue = base * (trendPct / 100) * (index + 1);
    const fluctuation = base * (Math.random() - 0.5) * 0.03;
    return {
      month: months[index],
      value: Math.round(Math.max(base + trendValue + fluctuation, 0)),
    };
  });
};

const statusColors: Record<string, string> = {
  Available: "bg-green-100 text-green-700",
  Limited: "bg-yellow-100 text-yellow-700",
  Unavailable: "bg-red-100 text-red-600",
};

const StatusBadge = ({ status }: { status?: string }) => {
  if (!status) return null;
  return (
    <span className={`ml-auto text-xs font-semibold px-1.5 py-0.5 rounded-full ${statusColors[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
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
      PMS: parseFloat(depot.PMS.price.replace(/[₦$,]/g, "").trim()) || 0,
      ATK: parseFloat(depot.ATK.price.replace(/[₦$,]/g, "").trim()) || 0,
      AGO: parseFloat(depot.AGO.price.replace(/[₦$,]/g, "").trim()) || 0,
    };

    const remainingLiters = {
      PMS: depot.PMS.currentLitres,
      ATK: depot.ATK.currentLitres,
      AGO: depot.AGO.currentLitres,
    };
    const capacityLiters = {
      PMS: depot.PMS.capacityLitres,
      ATK: depot.ATK.capacityLitres,
      AGO: depot.AGO.capacityLitres,
    };
    const soldLiters = {
      PMS: Math.max(0, capacityLiters.PMS - remainingLiters.PMS),
      ATK: Math.max(0, capacityLiters.ATK - remainingLiters.ATK),
      AGO: Math.max(0, capacityLiters.AGO - remainingLiters.AGO),
    };
    const totalLiters = {
      PMS: capacityLiters.PMS,
      ATK: capacityLiters.ATK,
      AGO: capacityLiters.AGO,
    };

    return {
      avgPrices: prices,
      totalSoldLiters: soldLiters,
      totalRemainingLiters: remainingLiters,
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

  const trends = { PMS: 1.5, ATK: -0.8, AGO: 1.2 };
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

        {/* Content Area */}
        <div className="relative">
          <div>
            {/* Market Prices Tab */}
            <div className={`p-2 transition-opacity duration-300 ${activeTab === "prices" ? "block opacity-100" : "hidden opacity-0"}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {/* PMS Card */}
                <div className="bg-white rounded-lg border-l-4 border-red-500 p-1.5 shadow-sm hover:shadow-md transition-shadow">
                  <h5 className="text-sm font-bold text-red-600 mb-0.5 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    PMS (Petrol)
                    <StatusBadge status={depotProducts[selectedDepot]?.PMS?.status} />
                  </h5>
                  <div className="space-y-0.5 text-sm relative overflow-hidden">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Price</span>
                      <span className="font-bold text-gray-800">₦{Math.round(depotMetrics.avgPrices.PMS).toLocaleString()}/L</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Sold (L)</span>
                      <span className="font-bold text-gray-800">{depotMetrics.totalSoldLiters.PMS.toLocaleString()}</span>
                    </div>
                    <hr className="border-gray-100" />
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Remaining (L)</span>
                      <span className="font-bold text-gray-800">{depotMetrics.totalRemainingLiters.PMS.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* ATK Card */}
                <div className="bg-white rounded-lg border-l-4 border-green-500 p-1.5 shadow-sm hover:shadow-md transition-shadow">
                  <h5 className="text-sm font-bold text-green-600 mb-0.5 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    ATK (Jet Fuel)
                    <StatusBadge status={depotProducts[selectedDepot]?.ATK?.status} />
                  </h5>
                  <div className="space-y-0.5 text-sm">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Price</span>
                      <span className="font-bold text-gray-800">₦{Math.round(depotMetrics.avgPrices.ATK).toLocaleString()}/L</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Sold (L)</span>
                      <span className="font-bold text-gray-800">{depotMetrics.totalSoldLiters.ATK.toLocaleString()}</span>
                    </div>
                    <hr className="border-gray-100" />
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Remaining (L)</span>
                      <span className="font-bold text-gray-800">{depotMetrics.totalRemainingLiters.ATK.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* AGO Card */}
                <div className="bg-white rounded-lg border-l-4 border-blue-500 p-1.5 shadow-sm hover:shadow-md transition-shadow h-full">
                  <h5 className="text-sm font-bold text-blue-600 mb-0.5 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                    AGO (Diesel)
                    <StatusBadge status={depotProducts[selectedDepot]?.AGO?.status} />
                  </h5>
                  <div className="space-y-0.5 text-sm">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Price</span>
                      <span className="font-bold text-gray-800">₦{Math.round(depotMetrics.avgPrices.AGO).toLocaleString()}/L</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Sold (L)</span>
                      <span className="font-bold text-gray-800">{depotMetrics.totalSoldLiters.AGO.toLocaleString()}</span>
                    </div>
                    <hr className="border-gray-100" />
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Remaining (L)</span>
                      <span className="font-bold text-gray-800">{depotMetrics.totalRemainingLiters.AGO.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Trend Tab */}
            <div className={`p-2 transition-opacity duration-300 ${activeTab === "trend" ? "block opacity-100" : "hidden opacity-0"}`}>
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
                      formatter={(value: any) => `₦${Number(value).toLocaleString()}/L`}
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