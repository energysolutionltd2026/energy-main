"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getLgas } from "nigeria-state-lga-data";
import Head from "next/head";
import CustomerNavigation from "./CustomerNavigation";
import tower from "@/../public/tower.jpg";
import { useDepot } from "@/context/DepotContext";

// ─── Geo Zones & Pricing ─────────────────────────────────────────────────────

const GEO_ZONES: { name: string; states: string[] }[] = [
  { name: "North West",    states: ["Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Sokoto", "Zamfara"] },
  { name: "North East",    states: ["Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe"] },
  { name: "North Central", states: ["Benue", "FCT", "Kogi", "Kwara", "Nasarawa", "Niger", "Plateau"] },
  { name: "South West",    states: ["Ekiti", "Lagos", "Ogun", "Ondo", "Osun", "Oyo"] },
  { name: "South East",    states: ["Abia", "Anambra", "Ebonyi", "Enugu", "Imo"] },
  { name: "South South",   states: ["Akwa Ibom", "Bayelsa", "Cross River", "Delta", "Edo", "Rivers"] },
];

const STATE_PRICES: Record<string, number> = {
  Jigawa: 200_000, Kaduna: 185_000, Kano: 190_000, Katsina: 195_000,
  Kebbi: 210_000, Sokoto: 215_000, Zamfara: 205_000,
  Adamawa: 230_000, Bauchi: 220_000, Borno: 250_000, Gombe: 225_000,
  Taraba: 240_000, Yobe: 245_000,
  Benue: 180_000, FCT: 150_000, Kogi: 160_000, Kwara: 155_000,
  Nasarawa: 165_000, Niger: 175_000, Plateau: 185_000,
  Ekiti: 100_000, Lagos: 85_000, Ogun: 90_000, Ondo: 105_000,
  Osun: 95_000, Oyo: 95_000,
  Abia: 120_000, Anambra: 115_000, Ebonyi: 130_000, Enugu: 125_000, Imo: 120_000,
  "Akwa Ibom": 140_000, Bayelsa: 145_000, "Cross River": 135_000,
  Delta: 120_000, Edo: 115_000, Rivers: 125_000,
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputClass =
  "w-full bg-gray-900/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm";
const selectClass =
  "w-full bg-gray-900/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition text-sm";

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomerRentTruck() {
  const { depots } = useDepot();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [rentStep, setRentStep] = useState<1 | 2 | 3 | 4>(1);
  const [rentBook, setRentBook] = useState({
    depot: "", capacity: "", vehicleType: "", productType: "",
    zone: "", state: "", lga: "",
    fullName: "", phone: "", email: "", company: "", notes: "",
    paymentMethod: "",
  });
  const [confirmedTxn, setConfirmedTxn] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user;
        if (!u || u.role !== "customer") { router.push("/auth/login"); return; }
        setUser(u);
        setRentBook(b => ({ ...b, fullName: u.name || "", email: u.email || "", phone: u.phone || "" }));
      })
      .catch(() => router.push("/auth/login"));
  }, [router]);

  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-gray-950">
      <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
    </div>
  );

  const price = STATE_PRICES[rentBook.state] || 0;

  const handleConfirmPayment = async () => {
    const txnId = `TRK-${Date.now().toString().slice(-8)}`;
    const txnDate = new Date().toISOString().slice(0, 10);
    const { api } = await import("@/lib/db-client");

    await Promise.allSettled([
      api.truckRentals.create({
        rentedBy: user.email,
        pickupDepot: rentBook.depot,
        destinationState: rentBook.state,
        destinationLga: rentBook.lga || undefined,
        geoZone: rentBook.zone,
        productType: rentBook.productType as any || undefined,
        vehicleType: rentBook.vehicleType || undefined,
        capacityLitres: rentBook.capacity ? parseInt(rentBook.capacity.replace(/,/g, "")) : undefined,
        tripPrice: price,
        paymentMethod: rentBook.paymentMethod as any,
        status: "pending",
        notes: rentBook.notes || undefined,
        company: rentBook.company || undefined,
        reference: txnId,
      } as any),
      api.transactions.create({
        type: "Truck Rental",
        user: user.name,
        userRole: "Customer",
        product: `Truck to ${rentBook.state}`,
        quantity: "1 trip",
        totalAmount: `₦${price.toLocaleString()}`,
        status: "Pending",
        paymentMethod: rentBook.paymentMethod,
        depot: rentBook.depot,
        reference: txnId,
        date: txnDate,
      } as any),
    ]);

    setConfirmedTxn({
      id: txnId, date: txnDate, type: "Truck Rental",
      depot: rentBook.depot, product: `Truck to ${rentBook.state}`,
      quantity: "1 trip", unitPrice: `₦${price.toLocaleString()}`,
      totalAmount: `₦${price.toLocaleString()}`,
      status: "Pending", paymentMethod: rentBook.paymentMethod,
    });
    setRentStep(4);
  };

  const resetFlow = () => {
    setRentStep(1);
    setRentBook({ depot: "", capacity: "", vehicleType: "", productType: "", zone: "", state: "", lga: "", fullName: user.name || "", phone: user.phone || "", email: user.email || "", company: "", notes: "", paymentMethod: "" });
    setConfirmedTxn(null);
  };

  const STEP_LABELS = ["Truck Details", "Destination", "Your Details", "Payment"] as const;

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-white" style={{ backgroundImage: `url(${tower.src})` }}>
      <Head><title>Rent a Truck | e-Nergy</title></Head>
      <div className="fixed inset-0 bg-black/65 z-0" />
      <CustomerNavigation user={user} />

      <div className="relative z-10 pt-16 md:pl-64 min-h-screen">
        <div className="px-4 sm:px-6 py-8">

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white">Rent a Truck</h1>
            <p className="text-gray-400 text-sm mt-1">Book a certified petroleum tanker for your delivery.</p>
          </div>

          {/* Step Indicator */}
          {rentStep < 4 && (
            <div className="flex items-center mb-8">
              {STEP_LABELS.slice(0, 3).map((label, i) => {
                const num = (i + 1) as 1 | 2 | 3;
                const done = rentStep > num;
                const active = rentStep === num;
                return (
                  <React.Fragment key={label}>
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all
                        ${done ? "bg-green-500 text-white" : active ? "bg-orange-500 text-white ring-4 ring-orange-500/30" : "bg-gray-700 text-gray-400"}`}>
                        {done ? "✓" : num}
                      </div>
                      <span className={`text-[10px] font-semibold whitespace-nowrap ${active ? "text-orange-400" : done ? "text-green-400" : "text-gray-500"}`}>{label}</span>
                    </div>
                    {i < 2 && <div className={`flex-1 max-w-16 h-px mb-4 mx-1 ${done ? "bg-green-500" : "bg-gray-700"}`} />}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {/* ── STEP 1: Truck Details ── */}
          {rentStep === 1 && (
            <div className="max-w-2xl space-y-4">
              <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-6 space-y-4">
                <h2 className="font-bold text-white text-base">Truck Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Loading Depot</label>
                    <select className={selectClass} value={rentBook.depot} onChange={e => setRentBook(p => ({ ...p, depot: e.target.value }))}>
                      <option value="">— Select Depot —</option>
                      {depots.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Tank Capacity</label>
                    <select className={selectClass} value={rentBook.capacity} onChange={e => setRentBook(p => ({ ...p, capacity: e.target.value }))}>
                      <option value="">Any Capacity</option>
                      <option value="33,000">33,000 Litres</option>
                      <option value="45,000">45,000 Litres</option>
                      <option value="60,000">60,000 Litres</option>
                      <option value="100,000">100,000 Litres</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Vehicle Type</label>
                    <select className={selectClass} value={rentBook.vehicleType} onChange={e => setRentBook(p => ({ ...p, vehicleType: e.target.value }))}>
                      <option value="">Any Type</option>
                      <option value="Articulated Tanker">Articulated Tanker</option>
                      <option value="Rigid Tanker">Rigid Tanker</option>
                      <option value="Mini Tanker">Mini Tanker</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Product Type</label>
                    <select className={selectClass} value={rentBook.productType} onChange={e => setRentBook(p => ({ ...p, productType: e.target.value }))}>
                      <option value="">Any Product</option>
                      <option value="PMS">PMS (Petrol)</option>
                      <option value="AGO">AGO (Diesel)</option>
                      <option value="ATK">ATK (Jet Fuel)</option>
                      <option value="LPG">LPG (Gas)</option>
                    </select>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { if (!rentBook.depot) { alert("Please select a loading depot"); return; } setRentStep(2); }}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-lg shadow-orange-500/20"
              >
                Next: Select Destination →
              </button>
            </div>
          )}

          {/* ── STEP 2: Destination & Price ── */}
          {rentStep === 2 && (
            <div className="max-w-2xl space-y-4">
              <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-6 space-y-5">
                <h2 className="font-bold text-white text-base">Select Destination</h2>

                {/* Geo Zone Cards */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Geopolitical Zone</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {GEO_ZONES.map(z => (
                      <button key={z.name} type="button"
                        onClick={() => setRentBook(p => ({ ...p, zone: z.name, state: "", lga: "" }))}
                        className={`px-3 py-3 rounded-xl border-2 text-left transition-all
                          ${rentBook.zone === z.name ? "border-orange-500 bg-orange-500/10" : "border-gray-700 hover:border-orange-500/50"}`}>
                        <p className={`text-sm font-bold ${rentBook.zone === z.name ? "text-orange-400" : "text-gray-300"}`}>{z.name}</p>
                        <p className="text-[10px] text-gray-500 font-normal mt-0.5">{z.states.length} states</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* State Pills */}
                {rentBook.zone && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Select State</p>
                    <div className="flex flex-wrap gap-2">
                      {GEO_ZONES.find(z => z.name === rentBook.zone)?.states.map(st => (
                        <button key={st} type="button"
                          onClick={() => setRentBook(p => ({ ...p, state: st, lga: "" }))}
                          className={`px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all
                            ${rentBook.state === st ? "border-orange-500 bg-orange-500 text-white" : "border-gray-700 hover:border-orange-500/50 text-gray-300"}`}>
                          {st}
                          {STATE_PRICES[st] && (
                            <span className={`block text-[10px] font-bold mt-0.5 ${rentBook.state === st ? "text-orange-100" : "text-orange-500"}`}>
                              ₦{(STATE_PRICES[st] / 1000).toFixed(0)}k
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* LGA */}
                {rentBook.state && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Select LGA</label>
                    <select className={selectClass} value={rentBook.lga} onChange={e => setRentBook(p => ({ ...p, lga: e.target.value }))}>
                      <option value="">— Select LGA —</option>
                      {getLgas(rentBook.state).map((l: string) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                )}

                {/* Price Banner */}
                {rentBook.state && STATE_PRICES[rentBook.state] && (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Estimated Trip Price</p>
                    <p className="text-3xl font-black text-orange-400">₦{STATE_PRICES[rentBook.state].toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">Base rate for {rentBook.state} ({rentBook.zone}) · Final price confirmed after booking.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setRentStep(1)} className="flex-1 py-3 border-2 border-gray-700 text-gray-400 font-semibold rounded-xl hover:bg-gray-800/50 transition text-sm">← Back</button>
                <button
                  onClick={() => { if (!rentBook.state) { alert("Please select a destination state"); return; } setRentStep(3); }}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-lg shadow-orange-500/20"
                >
                  Next: Your Details →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Your Details ── */}
          {rentStep === 3 && (
            <div className="max-w-2xl space-y-4">
              <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-6 space-y-4">
                <h2 className="font-bold text-white text-base">Your Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Full Name</label>
                    <input type="text" className={inputClass} placeholder="Enter your full name" value={rentBook.fullName}
                      onChange={e => setRentBook(p => ({ ...p, fullName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Phone Number</label>
                    <input type="tel" className={inputClass} placeholder="+234 xxx xxx xxxx" value={rentBook.phone}
                      onChange={e => setRentBook(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Email Address</label>
                    <input type="email" className={inputClass} placeholder="you@example.com" value={rentBook.email}
                      onChange={e => setRentBook(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Company / Organisation (optional)</label>
                    <input type="text" className={inputClass} placeholder="e.g. Sunrise Filling Station" value={rentBook.company}
                      onChange={e => setRentBook(p => ({ ...p, company: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">Additional Notes (optional)</label>
                    <textarea className={inputClass} rows={3} placeholder="Any special requirements..." value={rentBook.notes}
                      onChange={e => setRentBook(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                </div>

                {/* Cost Summary */}
                {rentBook.state && (
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Trip Price</p>
                      <p className="text-xs text-gray-500 mt-0.5">{rentBook.state} · {rentBook.zone}</p>
                    </div>
                    <p className="text-2xl font-black text-orange-400">₦{price.toLocaleString()}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setRentStep(2)} className="flex-1 py-3 border-2 border-gray-700 text-gray-400 font-semibold rounded-xl hover:bg-gray-800/50 transition text-sm">← Back</button>
                <button
                  onClick={() => {
                    if (!rentBook.fullName || !rentBook.phone || !rentBook.email) { alert("Please fill in your name, phone and email"); return; }
                    setRentStep(4);
                  }}
                  className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-lg shadow-orange-500/20"
                >
                  Next: Payment →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Payment ── */}
          {rentStep === 4 && !confirmedTxn && (
            <div className="max-w-2xl space-y-4">
              {/* Amount Due */}
              <div className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl p-5 space-y-3">
                <h2 className="font-bold text-white text-base mb-2">Payment</h2>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Amount Due</p>
                    <p className="text-3xl font-black text-orange-400">₦{price.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{rentBook.state}{rentBook.lga ? ` · ${rentBook.lga}` : ""}</p>
                  </div>
                  <div className="text-right text-xs text-gray-400 space-y-0.5">
                    <p className="font-semibold text-gray-300">{rentBook.fullName}</p>
                    <p>{rentBook.depot}</p>
                    <p>{rentBook.zone}</p>
                  </div>
                </div>

                {/* Payment Methods */}
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-2">Select Payment Method</p>
                <div className="space-y-2">
                  {([
                    { id: "bank_transfer", label: "Bank Transfer",      desc: "Direct bank transfer to our account",   icon: "🏦" },
                    { id: "card",          label: "Debit / Credit Card", desc: "Visa, Mastercard, Verve",               icon: "💳" },
                    { id: "wallet",        label: "e-Wallet",            desc: "Pay from your e-Nergy wallet balance",  icon: "👛" },
                    { id: "opay",          label: "OPay",                desc: "Pay via OPay mobile money",             icon: "📱" },
                    { id: "cash",          label: "Cash",                desc: "Pay cash on truck collection",          icon: "💵" },
                  ] as const).map(method => (
                    <button key={method.id} type="button"
                      onClick={() => setRentBook(p => ({ ...p, paymentMethod: method.id }))}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border-2 text-left transition-all
                        ${rentBook.paymentMethod === method.id ? "border-orange-500 bg-orange-500/10" : "border-gray-700 hover:border-gray-600"}`}>
                      <span className="text-2xl">{method.icon}</span>
                      <div className="flex-1">
                        <p className={`text-sm font-bold ${rentBook.paymentMethod === method.id ? "text-orange-400" : "text-gray-300"}`}>{method.label}</p>
                        <p className="text-xs text-gray-500">{method.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                        ${rentBook.paymentMethod === method.id ? "border-orange-500 bg-orange-500" : "border-gray-600"}`}>
                        {rentBook.paymentMethod === method.id && <span className="text-white text-[10px]">✓</span>}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Bank Transfer Details */}
                {rentBook.paymentMethod === "bank_transfer" && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 space-y-1 text-sm">
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Bank Transfer Details</p>
                    <p className="text-gray-300"><span className="text-gray-500">Bank:</span> First Bank Nigeria</p>
                    <p className="text-gray-300"><span className="text-gray-500">Account Name:</span> PNB Energy Ltd</p>
                    <p className="text-gray-300"><span className="text-gray-500">Account Number:</span> <span className="font-mono font-bold text-white">3012345678</span></p>
                    <p className="text-xs text-blue-400 mt-1">Use your name as reference. Send proof to trucks@pipesandbarrels.com</p>
                  </div>
                )}

                {/* OPay Details */}
                {rentBook.paymentMethod === "opay" && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 space-y-1 text-sm">
                    <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-2">OPay Details</p>
                    <p className="text-gray-300"><span className="text-gray-500">OPay Number:</span> <span className="font-mono font-bold text-white">08087550875</span></p>
                    <p className="text-gray-300"><span className="text-gray-500">Account Name:</span> PNB Energy Ltd</p>
                    <p className="text-xs text-green-400 mt-1">Send payment via OPay app then contact us with your receipt.</p>
                  </div>
                )}

                {/* Cash Note */}
                {rentBook.paymentMethod === "cash" && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-1">Cash Payment</p>
                    <p className="text-sm text-gray-300">Full payment of <span className="font-black text-orange-400">₦{price.toLocaleString()}</span> is due on truck collection at <span className="font-semibold text-white">{rentBook.depot || "your selected depot"}</span>.</p>
                  </div>
                )}

                {/* Card Note */}
                {rentBook.paymentMethod === "card" && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                    <p className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-1">Card Payment</p>
                    <p className="text-sm text-gray-300">You will be redirected to our secure payment gateway after confirming this booking.</p>
                  </div>
                )}

                {/* Wallet Note */}
                {rentBook.paymentMethod === "wallet" && (
                  <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
                    <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">e-Wallet Payment</p>
                    <p className="text-sm text-gray-300">Your e-Nergy wallet will be debited <span className="font-black text-orange-400">₦{price.toLocaleString()}</span> upon confirmation.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setRentStep(3)} className="flex-1 py-3 border-2 border-gray-700 text-gray-400 font-semibold rounded-xl hover:bg-gray-800/50 transition text-sm">← Back</button>
                <button
                  onClick={() => { if (!rentBook.paymentMethod) { alert("Please select a payment method"); return; } handleConfirmPayment(); }}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition shadow-lg"
                >
                  Confirm Booking ✓
                </button>
              </div>
            </div>
          )}

          {/* ── CONFIRMATION ── */}
          {confirmedTxn && (
            <div className="max-w-lg mx-auto">
              <div className="bg-black/50 backdrop-blur-md border border-gray-700 rounded-2xl p-10 text-center space-y-5 shadow-2xl">
                <div className="w-16 h-16 bg-green-500/20 border border-green-500/40 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Booking Confirmed!</h2>
                  <p className="text-gray-400 text-sm mt-2">Your truck rental request has been submitted. Our team will contact you shortly.</p>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-5 text-left space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Transaction ID</span>
                    <span className="text-orange-400 font-mono font-bold">{confirmedTxn.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Destination</span>
                    <span className="text-white">{rentBook.state}{rentBook.lga ? `, ${rentBook.lga}` : ""}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Depot</span>
                    <span className="text-white">{confirmedTxn.depot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Payment</span>
                    <span className="text-white">{confirmedTxn.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-700 pt-2 mt-2">
                    <span className="text-gray-400 font-semibold">Total</span>
                    <span className="text-orange-400 font-black text-lg">{confirmedTxn.totalAmount}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <button onClick={() => router.push("/customer/TransactionHistory")}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-lg shadow-orange-500/20">
                    View Transaction History
                  </button>
                  <button onClick={resetFlow}
                    className="w-full py-3 border-2 border-gray-700 text-gray-400 font-semibold rounded-xl hover:bg-gray-800/50 transition text-sm">
                    Book Another Truck
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
