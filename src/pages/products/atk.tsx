import React, { useState, useEffect } from "react";
import Head from "next/head";
import AtkTankSimulation from "@/components/AtkTankSimulation";
import Link from "next/link";

function Atk() {
  const [level, setLevel] = useState(65);

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      api.depots.list().then((r: any) => {
        if (!r?.data?.length) return;
        const levels = r.data.map((d: any) => d.ATK?.level ?? 0).filter((l: number) => l > 0);
        if (levels.length) setLevel(Math.round(levels.reduce((a: number, b: number) => a + b, 0) / levels.length));
      }).catch(() => null);
    }).catch(() => null);
  }, []);
  return (
    <div className="relative min-h-screen w-screen overflow-hidden">
      <Head><title>ATK (Jet Fuel) | e-Nergy</title></Head>
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/tower.jpg')" }}
      />
      <div className="absolute inset-0 bg-black/60" />

      {/* CONTENT WRAPPER */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-10 flex flex-col items-center lg:flex-row lg:items-start gap-10 my-10">

        {/* TANK — fixed size at every breakpoint, always centered */}
        <div className="shrink-0 flex justify-center items-center mt-10 lg:mt-20 z-50
                        w-[280px] h-[320px]
                        sm:w-[380px] sm:h-[430px]
                        lg:w-[550px] lg:h-[calc(100vh-80px)]">
          <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg">
            <AtkTankSimulation level={level} />
          </div>
        </div>

        {/* RIGHT TEXT */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start justify-center text-white space-y-6 text-center lg:text-left lg:mt-20">
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-primary-dark">
            Automotive Diesel (DPK) Overview
          </h2>
          <p className="text-base sm:text-lg leading-relaxed">
            Our Diesel (often listed as DPK Diesel for Power/Kerosene-Product
            kits in some markets or simply Automotive Diesel) is designed for
            compression-ignition engines. e-Nergy supplies low-sulfur
            diesel with controlled cold-flow properties for reliable ignition in
            a variety of climates.
          </p>
          <Link
            href="/booknow?product=atk"
            className="w-full sm:w-auto text-center text-white bg-primary py-3 px-8 rounded-lg font-bold hover:bg-primary-dark transition"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Atk;
