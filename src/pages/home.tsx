import React, { useState, useEffect } from "react";
import Head from "next/head";
import { DepotProvider, useDepot, type ProductKey } from "../context/DepotContext";
import PmsTankSimulation from "../components/PmsTankSimulation";
import AtkTankSimulation from "../components/AtkTankSimulation";
import AgoTankSimulation from "../components/AgoTankSimulation";
import DepotDropdown from "../components/DepotDropdown";
import MarketPriceSection from "../components/MarketPriceSection";

/* ============== MAIN CONTENT COMPONENT ============== */
function HomeContent() {
  const {
    depots,
    selectedDepot,
    activeProduct,
    depotProducts,
    depotLogos,
    setSelectedDepot,
    setActiveProduct,
  } = useDepot();

  const activeDepotProducts = depotProducts[selectedDepot];

  /* ============== HANDLERS ============== */
  const handleDepotChange = (depot: string) => {
    setSelectedDepot(depot);
  };

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.user?.role === "admin") setIsSuperAdmin(true); })
      .catch(() => null);
  }, []);

  const depotProduct = (product: ProductKey) => depotProducts[selectedDepot]?.[product];

  /* ============== TANK RENDER ============== */
  const preciseLevel = (p?: { currentLitres?: number; capacityLitres?: number; level?: number }) => {
    if (p?.currentLitres != null && p?.capacityLitres && p.capacityLitres > 0)
      return (p.currentLitres / p.capacityLitres) * 100;
    return p?.level ?? 0;
  };

  const renderTankSimulation = () => {
    const logo = depotLogos[selectedDepot];
    const pms = depotProduct("PMS");
    const atk = depotProduct("ATK");
    const ago = depotProduct("AGO");
    switch (activeProduct) {
      case "PMS": return <PmsTankSimulation level={preciseLevel(pms)} logo={logo} maxVolume={pms?.capacityLitres ?? 220000} />;
      case "ATK": return <AtkTankSimulation level={preciseLevel(atk)} logo={logo} maxVolume={atk?.capacityLitres ?? 120000} />;
      case "AGO": return <AgoTankSimulation level={preciseLevel(ago)} logo={logo} maxVolume={ago?.capacityLitres ?? 260000} />;
      default:    return null;
    }
  };

  return (
    <>
      <Head><title>Dashboard | e-Nergy</title></Head>
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/tower.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      {/* Main Content Wrapper */}
      <div className="relative z-10 pb-20 sm:pb-24 pt-16 sm:pt-20">
        {/* ============== TOP SECTION: TANK + PRODUCT TABLE ============== */}
        <div className="flex flex-col lg:flex-row justify-center items-start max-w-7xl mx-auto gap-4 sm:gap-6 px-3 sm:px-4 py-4 sm:py-8">
          {/* LEFT – TANK SIMULATION */}
          <div className="w-[80vw] mx-auto lg:mx-0 lg:w-1/2 lg:max-w-[600px] order-2 lg:order-1 z-50 mt-16 sm:mt-20 lg:mt-28">
            <div className="w-full h-[350px] sm:h-[450px] lg:h-[calc((100vh-100px)*0.85)] p-2 sm:p-4 flex flex-col z-50">
              {/* PRODUCT NAV BUTTONS
                  z-50 + isolate creates new stacking context above SVG
                  onTouchEnd for mobile reliability */}
              <div className="flex justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 flex-wrap relative z-50 isolate bg-tan-500">
                {(["PMS", "ATK", "AGO"] as const).map((item) => {
                  const colors = {
                    PMS: "bg-red-500 hover:bg-red-400",
                    ATK: "bg-green-500 hover:bg-green-400",
                    AGO: "bg-blue-500 hover:bg-blue-400",
                  };

                  return (
                    <button
                      key={item}
                      onClick={() => setActiveProduct(item)}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        setActiveProduct(item);
                      }}
                      className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-bold text-xs sm:text-sm shadow-md transition-all duration-200 relative z-50 cursor-pointer touch-manipulation select-none
                        ${
                          activeProduct === item
                            ? `${colors[item]} text-white scale-105 z-50`
                            : "bg-white/90 text-gray-700 hover:bg-white z-50"
                        }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>

              {/* Tank wrapper: pointer-events-none prevents SVG from blocking buttons */}
              <div className="flex-1 min-h-0 pointer-events-none">
                <div className="w-full h-full pointer-events-auto">
                  {renderTankSimulation()}
                </div>
              </div>

            </div>
          </div>

          {/* RIGHT – DEPOT PRODUCT TABLE + MARKET PRICES */}
          <div className="w-full lg:w-1/2 lg:max-w-[600px] flex flex-col gap-3 order-3 lg:mt-[70px]">
            {/* Depot Product Table */}
            <div className="w-full bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl overflow-visible">
               {/* TABLE HEADER – Orange Gradient with Depot Dropdown + Buy From */}
               <div className="bg-gradient-to-r from-orange-700 via-orange-500 to-orange-300 px-4 sm:px-6 py-3 sm:py-4 rounded-t-lg flex items-center gap-3">
                 <div className="flex-1">
                   <DepotDropdown
                     label={selectedDepot}
                     options={depots}
                     selectedValue={selectedDepot}
                     onChange={handleDepotChange}
                     buttonClassName="!bg-white/20 hover:!bg-white/30 !text-white !border-white/40 !py-2 !px-4 text-sm font-bold w-full"
                   />
                 </div>
                 {isSuperAdmin && (
                   <button
                     onClick={() => fetch("/api/auth/logout", { method: "POST" }).finally(() => window.location.href = "/auth/login")}
                     className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white border border-white/40 rounded-lg py-2 px-3 text-xs font-semibold transition shrink-0"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                     </svg>
                     Logout
                   </button>
                 )}
               </div>

              {/* Product Table */}
              <div className="p-3 sm:p-6">
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed min-w-[320px]" key={selectedDepot}>
                    <thead>
                      <tr className="border-b-2 border-gray-300">
                        <th className="w-1/4 px-2 sm:px-4 py-2 sm:py-3 text-left font-bold text-xs sm:text-sm text-gray-700">
                          Product
                        </th>
                        <th className="w-1/4 px-2 sm:px-4 py-2 sm:py-3 text-left font-bold text-xs sm:text-sm text-gray-700">
                          Status
                        </th>
                        <th className="w-1/4 px-2 sm:px-4 py-2 sm:py-3 text-left font-bold text-xs sm:text-sm text-gray-700">
                          Price
                        </th>
                        <th className="w-1/4 px-2 sm:px-4 py-2 sm:py-3 text-left font-bold text-xs sm:text-sm text-gray-700">
                          Stock
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeDepotProducts &&
                        Object.entries(activeDepotProducts).map(([key, data]) => (
                          <tr
                            key={`${selectedDepot}-${key}`}
                            className={`border-b border-gray-200 transition-colors cursor-pointer
                              ${
                                activeProduct === key
                                  ? "bg-orange-50"
                                  : "hover:bg-gray-50"
                              }`}
                            onClick={() =>
                              setActiveProduct(key as "PMS" | "ATK" | "AGO")
                            }
                          >
                            <td className="px-2 sm:px-4 py-3 sm:py-4 font-bold text-xs sm:text-sm text-gray-800">
                              {key}
                            </td>
                            <td
                              className={`px-2 sm:px-4 py-3 sm:py-4 font-bold text-xs sm:text-sm ${
                                data.status === "available"
                                  ? "text-green-600"
                                  : data.status === "limited"
                                  ? "text-yellow-500"
                                  : "text-red-500"
                              }`}
                            >
                              {data.status}
                            </td>
                            <td className="px-2 sm:px-4 py-3 sm:py-4 text-gray-600 font-semibold text-xs sm:text-sm">
                              {data.price}
                            </td>
                            <td className="px-2 sm:px-4 py-3 sm:py-4 text-gray-600 text-xs sm:text-sm">
                              {data.quantity.split("/")[0]?.trim() ?? data.quantity}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Market Price Section - Compressed & Integrated */}
            <MarketPriceSection />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

/* ============== MAIN COMPONENT WITH PROVIDER ============== */
function Home() {
  return (
    <DepotProvider>
      <HomeContent />
    </DepotProvider>
  );
}

export default Home;