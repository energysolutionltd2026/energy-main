import React, { useState, useEffect } from "react";
import Head from "next/head";
import PmsTankSimulation from "@/components/PmsTankSimulation";
import Link from "next/link";

function Pms() {
  const [level, setLevel] = useState<number | null>(null);

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => {
      api.depots.list().then((r: any) => {
        if (!r?.data?.length) { setLevel(65); return; }
        const levels = r.data.map((d: any) => d.PMS?.level ?? 0).filter((l: number) => l > 0);
        setLevel(levels.length ? Math.round(levels.reduce((a: number, b: number) => a + b, 0) / levels.length) : 65);
      }).catch(() => setLevel(65));
    }).catch(() => setLevel(65));
  }, []);
  return (
    <div className="relative min-h-screen w-screen overflow-hidden">
      <Head><title>PMS (Petrol) | e-Nergy</title></Head>
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
            {level === null
              ? <div className="w-full h-full bg-gray-800/60 animate-pulse rounded-lg" />
              : <PmsTankSimulation level={level} />}
          </div>
        </div>

        {/* RIGHT TEXT */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start justify-center text-white space-y-6 text-center lg:text-left lg:mt-20">
          <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-primary-dark">
            Premium Motor Spirit (PMS) Overview
          </h2>
          <p className="text-base sm:text-lg leading-relaxed">
            Our Premium Motor Spirit (commonly known as petrol or gasoline)
            is a high-performance motor fuel formulated for modern
            spark-ignition engines. Our PMS is refined and blended to meet
            national and international standards, offering consistent
            performance, clean combustion, and optimized engine response.
          </p>
          <Link
            href="/booknow?product=pms"
            className="w-full sm:w-auto text-center text-white bg-primary py-3 px-8 rounded-lg font-bold hover:bg-primary-dark transition"
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Pms;
