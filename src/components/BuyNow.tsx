import React, { useState, useEffect } from "react";
import Link from "next/link";
import Head from "next/head";
import Image from "next/image";
import tower from "@/../public/tower.jpg";
import truck1 from "@/../public/truck1.jpg";
import truck2 from "@/../public/truck2.jpg";
import truck3 from "@/../public/truck3.jpg";
import NavBar from "@/components/NavBar";
import { useDepot } from "@/context/DepotContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanyInfo {
  name: string; dprRegNo: string; cacRegNo: string;
  headOfficeAddress: string; telephone: string; email: string; stationAddress: string; loadingDepot: string;
}
interface OwnerInfo {
  name: string; telephone: string; address: string;
  email: string; officialIdType: string; idNumber: string;
}
interface OwnedTruckInfo {
  vehicleType: string; tankCapacity: string;
  ullage1: string; ullage2: string; ullage3: string; ullage4: string; ullage5: string;
  tractorColor: string; tankColor: string; truckRegNumber: string; bodyInscription: string;
  truckChart: string; calibrationChart: string; otherDetails: string;
}
interface PurchaseInfo {
  productType: string; productQuantity: string; haulageTruck: string;
  driverName: string; driverIdType: string; driverIdNumber: string;
  selectedRentTruck: string; ownedTruck: OwnedTruckInfo;
}
interface PaymentInfo {
  paymentMethod: string; bankName: string; accountName: string; transactionRef: string;
}
interface FormData {
  company: CompanyInfo; owner: OwnerInfo; purchase: PurchaseInfo; payment: PaymentInfo;
}

const RENT_TRUCKS = [
  { id: "truck1", src: truck1, capacity: "33,000 Litres", label: "Truck A" },
  { id: "truck2", src: truck2, capacity: "45,000 Litres", label: "Truck B" },
  { id: "truck3", src: truck3, capacity: "60,000 Litres", label: "Truck C" },
];

const Field = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-xs font-semibold tracking-widest text-gray-500 uppercase">{label}</label>
    {children}
  </div>
);

const inputClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition placeholder-gray-400 bg-white";
const selectClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition bg-white";

const TruckCarousel = ({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) => {
  const [index, setIndex] = useState(0);
  const truck = RENT_TRUCKS[index];
  const isSelected = selectedId === truck.id;
  const prev = () => setIndex((i) => (i - 1 + RENT_TRUCKS.length) % RENT_TRUCKS.length);
  const next = () => setIndex((i) => (i + 1) % RENT_TRUCKS.length);
  
  // Handle dropdown change - when user selects capacity, update truck image
  const handleCapacityChange = (capacity: string) => {
    const truckIndex = RENT_TRUCKS.findIndex(t => t.capacity === capacity);
    if (truckIndex !== -1) {
      setIndex(truckIndex);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-lg border border-orange-200 overflow-hidden">
      {/* Dropdown for tank capacity selection */}
      <div className="bg-orange-500 px-3 py-2 space-y-2">
        <p className="text-white font-bold text-xs tracking-widest uppercase text-center">Select Tank Capacity</p>
        <select 
          className="w-full bg-white border-2 border-orange-300 rounded px-2 py-1.5 text-sm text-gray-800 font-semibold focus:outline-none focus:border-orange-600 focus:ring-2 focus:ring-orange-300 transition"
          value={truck.capacity}
          onChange={(e) => handleCapacityChange(e.target.value)}
        >
          {RENT_TRUCKS.map((t) => (
            <option key={t.id} value={t.capacity}>
              {t.capacity} - {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Image carousel with VISIBLE arrows */}
      <div className="relative flex-1 min-h-[180px] bg-gray-100">
        <Image src={truck.src} alt={truck.label} fill className="object-cover" />
        
        {/* Previous arrow - NOW VISIBLE with proper styling */}
        <button 
          type="button" 
          onClick={prev} 
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center text-2xl font-bold leading-none transition shadow-lg z-10"
          aria-label="Previous truck"
        >
          ‹
        </button>
        
        {/* Next arrow - NOW VISIBLE with proper styling */}
        <button 
          type="button" 
          onClick={next} 
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full w-9 h-9 flex items-center justify-center text-2xl font-bold leading-none transition shadow-lg z-10"
          aria-label="Next truck"
        >
          ›
        </button>
        
        {/* Dot indicators */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {RENT_TRUCKS.map((t, i) => (
            <button 
              key={t.id} 
              type="button" 
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${i === index ? "bg-orange-500 scale-125" : "bg-white/70 hover:bg-white"}`} 
              aria-label={`View ${t.label}`}
            />
          ))}
        </div>
      </div>

      {/* Selection button */}
      <div className="p-3 bg-white border-t border-gray-100">
        <button 
          type="button" 
          onClick={() => onSelect(isSelected ? "" : truck.id)}
          className={`w-full py-2 rounded text-sm font-bold transition-all ${isSelected ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-600 border border-gray-200"}`}
        >
          {isSelected ? "✓ Selected" : "Select This Truck"}
        </button>
      </div>
    </div>
  );
};

const OwnedTruckPanel = ({ data, onChange }: { data: OwnedTruckInfo; onChange: (d: Partial<OwnedTruckInfo>) => void }) => (
  <div className="flex flex-col h-full rounded-lg border-2 border-orange-400 overflow-hidden">
    <div className="bg-orange-500 px-4 py-2.5 text-center">
      <p className="text-white font-bold text-sm tracking-widest uppercase">Truck Information</p>
    </div>
    <div className="flex-1 overflow-y-auto p-4 bg-white space-y-3">
      <Field label="Vehicle Make">
        <select className={selectClass} value={data.vehicleType} onChange={(e) => onChange({ vehicleType: e.target.value })}>
          <option value=""></option>
          <option value="mack">Mack</option>
          <option value="howo">Howo</option>
          <option value="daf">DAF</option>
          <option value="man">MAN</option>
          <option value="iveco">Iveco</option>
          <option value="mercedes">Mercedes-Benz</option>
          <option value="volvo">Volvo</option>
          <option value="scania">Scania</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field label="Tank Capacity">
        <select className={selectClass} value={data.tankCapacity} onChange={(e) => onChange({ tankCapacity: e.target.value })}>
          <option value=""></option>
          <option value="33000">33,000 Litres</option>
          <option value="45000">45,000 Litres</option>
          <option value="60000">60,000 Litres</option>
          <option value="100000">100,000 Litres</option>
        </select>
      </Field>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Ullage Compartment</label>
        <div className="grid grid-cols-3 gap-3">
          {(["ullage1", "ullage2", "ullage3", "ullage4", "ullage5"] as const).map((key, i) => (
            <div key={key} className="flex flex-col gap-1">
              <input className={inputClass} placeholder="enter value" value={data[key]} maxLength={10} onChange={(e) => onChange({ [key]: e.target.value })} />
              <span className="text-[10px] text-center text-gray-400 font-medium">{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
      <Field label="Tractor Color"><input className={inputClass} placeholder="input colors" value={data.tractorColor} onChange={(e) => onChange({ tractorColor: e.target.value })} /></Field>
      <Field label="Tank Color"><input className={inputClass} placeholder="input colors" value={data.tankColor} onChange={(e) => onChange({ tankColor: e.target.value })} /></Field>
      <Field label="Truck Registration Number"><input className={inputClass} placeholder="enter truck reg. no." value={data.truckRegNumber} maxLength={20} onChange={(e) => onChange({ truckRegNumber: e.target.value })} /></Field>
      <Field label="Truck Body Inscription"><input className={inputClass} placeholder="e.g. company name, logo text" value={data.bodyInscription} maxLength={50} onChange={(e) => onChange({ bodyInscription: e.target.value })} /></Field>
    </div>
  </div>
);

const CompanyStage = ({ data, onChange }: { data: CompanyInfo; onChange: (d: Partial<CompanyInfo>) => void }) => {
  const { depots } = useDepot();
  return (
  <div className="space-y-4">
    <div>
      <h2 className="text-2xl font-bold text-gray-800">Company Information</h2>
      <p className="text-sm italic text-gray-500 mt-1">Carefully enter your company details into the columns provided.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      <Field label="select loading depot">
            <select className={selectClass} value={data.loadingDepot} onChange={(e) => onChange({ loadingDepot: e.target.value })}>
              <option value="">select a loading depot</option>
              {depots.length > 0 ? depots.map(d => <option key={d} value={d}>{d}</option>) : (
                <>
                  <option value="Lagos Main Depot">Lagos Main Depot</option>
                  <option value="Port Harcourt Terminal">Port Harcourt Terminal</option>
                  <option value="Abuja Central Terminal">Abuja Central Terminal</option>
                  <option value="Warri Storage Facility">Warri Storage Facility</option>
                </>
              )}
            </select>
          </Field>
    </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Name of Company"><input className={inputClass} placeholder="e.g. Chipet Oil" value={data.name} onChange={(e) => onChange({ name: e.target.value })} /></Field>
      <Field label="Marketer's License Number"><input className={inputClass} placeholder="**********" value={data.dprRegNo} onChange={(e) => onChange({ dprRegNo: e.target.value })} /></Field>
    </div>
    <Field label="CAC Registration Number"><input className={inputClass} placeholder="e.g. RN4893464" value={data.cacRegNo} onChange={(e) => onChange({ cacRegNo: e.target.value })} /></Field>
    <Field label="Head Office Address"><input className={inputClass} placeholder="124, Marwa road, depot bus-stop, Ijegun waterside, Lagos." value={data.headOfficeAddress} onChange={(e) => onChange({ headOfficeAddress: e.target.value })} /></Field>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Telephone"><input className={inputClass} placeholder="+234 814 343 2374" value={data.telephone} onChange={(e) => onChange({ telephone: e.target.value })} /></Field>
      <Field label="Email"><input className={inputClass} placeholder="info@chipetoil.com" type="email" value={data.email} onChange={(e) => onChange({ email: e.target.value })} /></Field>
    </div>
    <Field label="Station Address for Delivery"><input className={inputClass} placeholder="124, Marwa road, depot bus-stop, Ijegun waterside, Lagos." value={data.stationAddress} onChange={(e) => onChange({ stationAddress: e.target.value })} /></Field>
  </div>
  );
};

const OwnerStage = ({ data, onChange }: { data: OwnerInfo; onChange: (d: Partial<OwnerInfo>) => void }) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-2xl font-bold text-gray-800">Owner&apos;s Information</h2>
      <p className="text-sm italic text-gray-500 mt-1">Carefully fill in your company owner&apos;s details into the columns provided.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Name"><input className={inputClass} placeholder="enter your name" value={data.name} onChange={(e) => onChange({ name: e.target.value })} /></Field>
      <Field label="Telephone"><input className={inputClass} placeholder="(+234)" value={data.telephone} onChange={(e) => onChange({ telephone: e.target.value })} /></Field>
    </div>
    <Field label="Station Address"><input className={inputClass} placeholder="enter your station address" value={data.address} onChange={(e) => onChange({ address: e.target.value })} /></Field>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Email"><input className={inputClass} placeholder="enter your email" type="email" value={data.email} onChange={(e) => onChange({ email: e.target.value })} /></Field>
      <Field label="Official ID Type">
        <select className={selectClass} value={data.officialIdType} onChange={(e) => onChange({ officialIdType: e.target.value })}>
          <option value="">Select an official ID</option>
          <option value="nin">NIN</option>
          <option value="passport">International Passport</option>
          <option value="drivers-license">Driver&apos;s License</option>
          <option value="voters-card">Voter&apos;s Card</option>
        </select>
      </Field>
    </div>
    <Field label="ID Number"><input className={inputClass} placeholder="enter selected ID number" value={data.idNumber} onChange={(e) => onChange({ idNumber: e.target.value })} /></Field>
  </div>
);

const PurchaseStage = ({ data, onChange }: { data: PurchaseInfo; onChange: (d: Partial<PurchaseInfo>) => void }) => {
  const isRentTruck = data.haulageTruck === "Rent Truck";
  const isOwnedTruck = data.haulageTruck === "Owned Truck";
  const updateOwnedTruck = (d: Partial<OwnedTruckInfo>) => onChange({ ownedTruck: { ...data.ownedTruck, ...d } });
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Product Purchasing</h2>
        <p className="text-sm italic text-gray-500 mt-1">Carefully fill in the details of the product you wish to purchase and your company&apos;s logistics for delivery.</p>
      </div>
      <div className="space-y-4">
        <Field label="Product Type">
          <select className={selectClass} value={data.productType} onChange={(e) => onChange({ productType: e.target.value })}>
            <option value="">select type</option>
            <option value="ago">AGO (Diesel)</option>
            <option value="pms">PMS (Petrol)</option>
            <option value="atk">ATK (Jet Fuel)</option>
          </select>
        </Field>
        <Field label="Product Quantity">
          <select className={selectClass} value={data.productQuantity} onChange={(e) => onChange({ productQuantity: e.target.value })}>
            <option value="">select or manually enter a quantity</option>
            <option value="33000">33,000 litres</option>
            <option value="45000">45,000 litres</option>
            <option value="60000">60,000 litres</option>
            <option value="100000">100,000 litres</option>
          </select>
        </Field>
        <Field label="Haulage Truck">
          <select className={selectClass} value={data.haulageTruck} onChange={(e) => onChange({ haulageTruck: e.target.value, selectedRentTruck: "" })}>
            <option value="">select truck</option>
            <option value="Owned Truck">Own Truck</option>
            <option value="Rent Truck">Rent Truck</option>
          </select>
        </Field>

        {isOwnedTruck && (
          <div className="rounded-lg border-2 border-orange-400 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-orange-500 px-4 py-2.5">
              <p className="text-white font-bold text-sm tracking-widest uppercase">Truck Information</p>
            </div>
            <div className="p-4 bg-white space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Vehicle Make">
                  <select className={selectClass} value={data.ownedTruck.vehicleType} onChange={(e) => updateOwnedTruck({ vehicleType: e.target.value })}>
                    <option value=""></option>
                    <option value="mack">Mack</option>
                    <option value="howo">Howo</option>
                    <option value="daf">DAF</option>
                    <option value="man">MAN</option>
                    <option value="iveco">Iveco</option>
                    <option value="mercedes">Mercedes-Benz</option>
                    <option value="volvo">Volvo</option>
                    <option value="scania">Scania</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                <Field label="Tank Capacity">
                  <select className={selectClass} value={data.ownedTruck.tankCapacity} onChange={(e) => updateOwnedTruck({ tankCapacity: e.target.value })}>
                    <option value=""></option>
                    <option value="33000">33,000 Litres</option>
                    <option value="45000">45,000 Litres</option>
                    <option value="60000">60,000 Litres</option>
                    <option value="100000">100,000 Litres</option>
                  </select>
                </Field>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Ullage Compartment</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["ullage1", "ullage2", "ullage3", "ullage4", "ullage5"] as const).map((key, i) => (
                    <div key={key} className="flex flex-col gap-1">
                      <input className={inputClass} placeholder="enter value" value={data.ownedTruck[key]} maxLength={10} onChange={(e) => updateOwnedTruck({ [key]: e.target.value })} />
                      <span className="text-[10px] text-center text-gray-400 font-medium">{i + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Tractor Color"><input className={inputClass} placeholder="input colors" value={data.ownedTruck.tractorColor} onChange={(e) => updateOwnedTruck({ tractorColor: e.target.value })} /></Field>
                <Field label="Tank Color"><input className={inputClass} placeholder="input colors" value={data.ownedTruck.tankColor} onChange={(e) => updateOwnedTruck({ tankColor: e.target.value })} /></Field>
              </div>
              <Field label="Truck Registration Number"><input className={inputClass} placeholder="enter truck reg. no." value={data.ownedTruck.truckRegNumber} maxLength={20} onChange={(e) => updateOwnedTruck({ truckRegNumber: e.target.value })} /></Field>
                <Field label="Truck Body Inscription"><input className={inputClass} placeholder="e.g. company name, logo text" value={data.ownedTruck.bodyInscription} maxLength={50} onChange={(e) => updateOwnedTruck({ bodyInscription: e.target.value })} /></Field>
                <Field label="Truck Chart"><input className={inputClass} placeholder="enter truck chart number/reference" value={data.ownedTruck.truckChart} maxLength={50} onChange={(e) => updateOwnedTruck({ truckChart: e.target.value })} /></Field>
                <Field label="Calibration Chart"><input className={inputClass} placeholder="enter calibration certificate reference" value={data.ownedTruck.calibrationChart} maxLength={50} onChange={(e) => updateOwnedTruck({ calibrationChart: e.target.value })} /></Field>
                <Field label="Other Necessary Details">
                  <textarea className={inputClass} placeholder="enter any additional truck details or notes" value={data.ownedTruck.otherDetails} maxLength={200} onChange={(e) => updateOwnedTruck({ otherDetails: e.target.value })} rows={3} />
                </Field>
              </div>
          </div>
        )}

        {isRentTruck && (
          <div className="flex items-center justify-center rounded-lg border-2 border-orange-400 bg-orange-50 min-h-[180px]">
            <div className="text-center p-4 space-y-3">
              <h3 className="text-xl font-bold text-orange-700">Rent a Truck</h3>
              <p className="text-base text-gray-600 leading-relaxed">
                To rent a truck for your delivery, please visit our Truck Rental page to browse available trucks and complete your rental.
              </p>
            </div>
          </div>
        )}

        <Field label="Driver's Name">
          <input className={inputClass} placeholder="enter driver's full name" value={data.driverName} onChange={(e) => onChange({ driverName: e.target.value })} disabled={isRentTruck} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Driver's ID">
            <select className={selectClass} value={data.driverIdType} onChange={(e) => onChange({ driverIdType: e.target.value })} disabled={isRentTruck}>
              <option value="">select ID type</option>
              <option value="nin">NIN</option>
              <option value="passport">Passport</option>
              <option value="drivers-license">Driver&apos;s License</option>
            </select>
          </Field>
          <Field label="Driver's ID Number">
            <input className={inputClass} placeholder="enter ID number" value={data.driverIdNumber} onChange={(e) => onChange({ driverIdNumber: e.target.value })} disabled={isRentTruck} />
          </Field>
        </div>
      </div>
    </div>
  );
};

const PAYMENT_METHODS = [
  { value: "bank-transfer", label: "Bank Transfer", icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M3 10h18M7 15h2M12 15h2" strokeLinecap="round" /><path d="M12 3L3 8h18L12 3z" /></svg>) },
  { value: "card", label: "Debit / Credit Card", icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" strokeLinecap="round" /><path d="M6 15h4" strokeLinecap="round" /></svg>) },
  { value: "opay", label: "OPay", icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" strokeLinecap="round" /><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" /></svg>) },
  { value: "paystack", label: "Paystack", icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-7 h-7"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" strokeLinecap="round" /><path d="M7 15h4M15 15h2" strokeLinecap="round" /><circle cx="6" cy="7.5" r="0.8" fill="currentColor" stroke="none" /></svg>) },
];

const PaymentStage = ({ data, onChange, bankSettings, availableMethods = PAYMENT_METHODS }: { data: PaymentInfo; onChange: (d: Partial<PaymentInfo>) => void; bankSettings: { bankName: string; bankAccountName: string; bankAccountNumber: string; opayNumber: string }; availableMethods?: typeof PAYMENT_METHODS }) => {
  const isPaystack = data.paymentMethod === "paystack";
  const isManual = data.paymentMethod && data.paymentMethod !== "paystack";
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Payment</h2>
        <p className="text-sm italic text-gray-500 mt-1">Complete your purchase by selecting a payment method.</p>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Payment Method</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
          {availableMethods.map((method) => {
            const selected = data.paymentMethod === method.value;
            return (
              <button key={method.value} type="button" onClick={() => onChange({ paymentMethod: method.value })}
                className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 px-3 py-4 transition-all focus:outline-none ${selected ? "border-orange-500 bg-orange-50 text-orange-600 shadow-md" : "border-gray-200 bg-white text-gray-500 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50/40"}`}>
                {method.icon}
                <span className="text-xs font-semibold text-center leading-tight">{method.label}</span>
                {selected && <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">Selected ✓</span>}
              </button>
            );
          })}
        </div>
      </div>
      {isPaystack && (
        <div className="rounded-lg border-2 border-teal-400 bg-teal-50 p-5 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-6 h-6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div>
            <p className="font-bold text-teal-800 text-sm">Secure Payment via Paystack</p>
            <p className="text-teal-700 text-xs mt-1 leading-relaxed">You will be securely redirected to Paystack&apos;s checkout to complete your payment. Paystack accepts cards, bank transfers, and USSD — no details needed here.</p>
          </div>
          <div className="flex items-center gap-2 text-teal-600 text-xs font-medium">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" /></svg>
            256-bit SSL encrypted · PCI DSS compliant
          </div>
        </div>
      )}
      {isManual && (
        <>
          {data.paymentMethod === "bank-transfer" && (
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 space-y-1">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-widest mb-2">Transfer to this account</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Bank:</span> {bankSettings.bankName}</p>
              <p className="text-sm text-gray-700"><span className="font-semibold">Account Name:</span> {bankSettings.bankAccountName}</p>
              {bankSettings.bankAccountNumber && <p className="text-sm text-gray-700"><span className="font-semibold">Account Number:</span> {bankSettings.bankAccountNumber}</p>}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Bank Name"><input className={inputClass} placeholder="enter your bank name" value={data.bankName} onChange={(e) => onChange({ bankName: e.target.value })} /></Field>
            <Field label="Account Name"><input className={inputClass} placeholder="account name used for transfer" value={data.accountName} onChange={(e) => onChange({ accountName: e.target.value })} /></Field>
          </div>
          <Field label="Transaction Reference / Receipt Number"><input className={inputClass} placeholder="enter transaction reference" value={data.transactionRef} onChange={(e) => onChange({ transactionRef: e.target.value })} /></Field>
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-800 mb-1">Important Notice</p>
            Please be informed that purchases processed within 48 hours of order placement require prior authorization. Ensure your transfer reference is accurate before completing your purchase.
          </div>
        </>
      )}
    </div>
  );
};

const STAGES = ["Company Info", "Owner Info", "Product Purchasing", "Payment"];
const StepIndicator = ({ current }: { current: number }) => (
  <div className="flex items-center mb-8">
    {STAGES.map((label, i) => {
      const done = i < current; const active = i === current;
      return (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${done ? "bg-orange-500 text-white" : active ? "bg-orange-500 text-white ring-4 ring-orange-200" : "bg-gray-200 text-gray-400"}`}>{done ? "✓" : i + 1}</div>
            <span className={`text-xs mt-1 font-medium whitespace-nowrap ${active ? "text-orange-600" : done ? "text-orange-400" : "text-gray-400"}`}>{label}</span>
          </div>
          {i < STAGES.length - 1 && <div className={`flex-1 h-0.5 mb-5 transition-all ${i < current ? "bg-orange-500" : "bg-gray-200"}`} />}
        </React.Fragment>
      );
    })}
  </div>
);

function generateOrderId(): string {
  const year = new Date().getFullYear();
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, "0");
  return `ENR-${year}-${seq}${letter}`;
}

const mapPaymentMethod = (m: string) => m === "bank-transfer" ? "bank_transfer" : m === "paystack" ? "card" : m;

export default function BuyNow() {
  const [stage, setStage] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isCustomer, setIsCustomer] = useState(false);
  const [bankSettings, setBankSettings] = useState({ bankName: "First Bank of Nigeria", bankAccountName: "e-Nergy Oil & Gas", bankAccountNumber: "", opayNumber: "" });
  const [platformInfo, setPlatformInfo] = useState({ platformName: "e-Nergy Oil & Gas Purchasing Portal", supportEmail: "info@e-nergy.com.ng", supportPhone: "(+234) 08087550875" });
  const [paystackKey, setPaystackKey] = useState("pk_test_REPLACE_WITH_YOUR_KEY");
  const [enabledMethods, setEnabledMethods] = useState({ enableBankTransfer: true, enablePaystack: true, enableOpay: true });
  const [prices, setPrices] = useState({ pms: 0, ago: 0, atk: 0 });

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => api.platformSettings.get()).then((s) => {
      if (!s) return;
      setBankSettings({ bankName: s.bankName || "First Bank of Nigeria", bankAccountName: s.bankAccountName || "e-Nergy Oil & Gas", bankAccountNumber: s.bankAccountNumber || "", opayNumber: s.opayNumber || "" });
      setPlatformInfo({ platformName: s.platformName || "e-Nergy Oil & Gas Purchasing Portal", supportEmail: s.supportEmail || "info@e-nergy.com.ng", supportPhone: s.supportPhone || "(+234) 08087550875" });
      if (s.paystackPublicKey) setPaystackKey(s.paystackPublicKey);
      setEnabledMethods({ enableBankTransfer: s.enableBankTransfer !== false, enablePaystack: s.enablePaystack !== false, enableOpay: s.enableOpay !== false });
      setPrices({ pms: s.pmsPricePerLitre || 0, ago: s.agoPricePerLitre || 0, atk: s.atkPricePerLitre || 0 });
    }).catch(() => null);
  }, []);

  const computeOrderTotal = () => {
    const qty   = Number(formData.purchase.productQuantity) || 0;
    const type  = formData.purchase.productType.toLowerCase();
    const price = type === "pms" ? prices.pms : type === "ago" ? prices.ago : type === "atk" ? prices.atk : 0;
    return qty * price;
  };

  useEffect(() => {
    if (document.getElementById("paystack-script")) return;
    const script = document.createElement("script");
    script.id = "paystack-script"; script.src = "https://js.paystack.co/v1/inline.js"; script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const u = data?.user;
        if (!u) return;
        if (u.role === "customer") setIsCustomer(true);
        setFormData((f) => ({
          ...f,
          company: {
            ...f.company,
            name: u.companyName || "",
            telephone: u.phone || "",
            email: u.email || "",
            headOfficeAddress: u.address || "",
          },
          owner: {
            ...f.owner,
            name: u.name || "",
            telephone: u.phone || "",
            email: u.email || "",
            address: u.address || "",
          },
        }));
      })
      .catch(() => null);
  }, []);

  const [formData, setFormData] = useState<FormData>({
    company: { name: "", dprRegNo: "", cacRegNo: "", headOfficeAddress: "", telephone: "", email: "", stationAddress: "", loadingDepot: "" },
    owner: { name: "", telephone: "", address: "", email: "", officialIdType: "", idNumber: "" },
    purchase: { productType: "", productQuantity: "", haulageTruck: "", driverName: "", driverIdType: "", driverIdNumber: "", selectedRentTruck: "", ownedTruck: { vehicleType: "", tankCapacity: "", ullage1: "", ullage2: "", ullage3: "", ullage4: "", ullage5: "", tractorColor: "", tankColor: "", truckRegNumber: "", bodyInscription: "", truckChart: "", calibrationChart: "", otherDetails: "" } },
    payment: { paymentMethod: "", bankName: "", accountName: "", transactionRef: "" },
  });

  const updateCompany  = (d: Partial<CompanyInfo>)  => setFormData((f) => ({ ...f, company:  { ...f.company,  ...d } }));
  const updateOwner    = (d: Partial<OwnerInfo>)    => setFormData((f) => ({ ...f, owner:    { ...f.owner,    ...d } }));
  const updatePurchase = (d: Partial<PurchaseInfo>) => setFormData((f) => ({ ...f, purchase: { ...f.purchase, ...d } }));
  const updatePayment  = (d: Partial<PaymentInfo>)  => setFormData((f) => ({ ...f, payment:  { ...f.payment,  ...d } }));

  const submitOrder = async (id: string, paystackRef?: string) => {
    setSubmitting(true);
    setSubmitError("");
    try {
      const { api } = await import("@/lib/db-client");
      const p = formData.purchase;
      const ullages = [p.ownedTruck.ullage1, p.ownedTruck.ullage2, p.ownedTruck.ullage3, p.ownedTruck.ullage4, p.ownedTruck.ullage5]
        .filter(Boolean).map(Number);
      const poDoc = await api.purchaseOrders.create({
        orderId: id,
        status: "Pending",
        loadingDepot: formData.company.loadingDepot,
        companyName: formData.company.name,
        dprRegNo: formData.company.dprRegNo,
        cacRegNo: formData.company.cacRegNo,
        companyAddress: formData.company.headOfficeAddress,
        companyTelephone: formData.company.telephone,
        companyEmail: formData.company.email,
        stationAddress: formData.company.stationAddress,
        ownerName: formData.owner.name,
        ownerTelephone: formData.owner.telephone,
        ownerAddress: formData.owner.address,
        ownerEmail: formData.owner.email,
        ownerIdType: formData.owner.officialIdType,
        ownerIdNumber: formData.owner.idNumber,
        productType: p.productType.toUpperCase(),
        productQuantity: Number(p.productQuantity),
        haulageTruck: p.haulageTruck as "Owned Truck" | "Rent Truck",
        ...(p.haulageTruck === "Owned Truck" && {
          vehicleType: p.ownedTruck.vehicleType || undefined,
          tankCapacity: p.ownedTruck.tankCapacity ? Number(p.ownedTruck.tankCapacity) : undefined,
          truckRegNumber: p.ownedTruck.truckRegNumber || undefined,
          tractorColor: p.ownedTruck.tractorColor || undefined,
          tankColor: p.ownedTruck.tankColor || undefined,
          bodyInscription: p.ownedTruck.bodyInscription || undefined,
          ullages: ullages.length ? ullages : undefined,
          driverName: p.driverName || undefined,
          driverIdType: p.driverIdType || undefined,
          driverIdNumber: p.driverIdNumber || undefined,
        }),
        paymentMethod: mapPaymentMethod(formData.payment.paymentMethod) as any,
        bankName: formData.payment.bankName || undefined,
        bankAccountName: formData.payment.accountName || undefined,
        transactionRef: paystackRef || formData.payment.transactionRef || `MANUAL-${Date.now()}`,
      } as any);

      // Create Transaction and cross-link with PurchaseOrder
      const txnDoc = await api.transactions.create({
        txnId:         `TXN-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
        type:          "Purchase Order",
        user:          formData.owner.name || formData.company.name,
        userEmail:     formData.owner.email || formData.company.email,
        userRole:      "Customer",
        product:       p.productType.toUpperCase(),
        quantity:      String(p.productQuantity),
        totalAmount:   computeOrderTotal(),
        status:        paystackRef ? "Completed" : "Pending",
        paymentMethod: mapPaymentMethod(formData.payment.paymentMethod) as any,
        depot:         formData.company.loadingDepot,
        reference:     id,
        referenceType: "purchase_order",
        ...(poDoc?._id ? { referenceId: poDoc._id } : {}),
      } as any).catch(() => null);

      if (txnDoc?._id && poDoc?._id) {
        api.purchaseOrders.update(String(poDoc._id), { transactionId: txnDoc._id } as any).catch(() => null);
      }
      // Send confirmation email (fire-and-forget — don't block the success screen)
      const email = formData.owner.email || formData.company.email;
      if (email) {
        fetch("/api/notify/order-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            name: formData.owner.name || formData.company.name,
            orderId: id,
            companyName: formData.company.name,
            product: formData.purchase.productType,
            quantity: formData.purchase.productQuantity,
            depot: formData.company.loadingDepot,
            paymentMethod: formData.payment.paymentMethod,
          }),
        }).catch(() => null);
      }
      setOrderId(id);
      setSubmitted(true);
    } catch {
      setSubmitError("Failed to save order. Please try again.");
    }
    setSubmitting(false);
  };

  const handlePaystack = () => {
    // @ts-ignore
    if (!window.PaystackPop) { alert("Payment gateway is still loading. Please wait a moment and try again."); return; }
    const id = generateOrderId();
    // @ts-ignore
    const handler = window.PaystackPop.setup({
      key: paystackKey, email: formData.owner.email || formData.company.email, amount: computeOrderTotal() * 100, currency: "NGN",
      ref: `PB-${Date.now()}`,
      metadata: { companyName: formData.company.name, productType: formData.purchase.productType, productQuantity: formData.purchase.productQuantity, haulageTruck: formData.purchase.haulageTruck },
      onClose: () => {},
      callback: (response: { reference: string }) => { submitOrder(id, response.reference); },
    });
    handler.openIframe();
  };

  const validateStage = (s: number): string => {
    if (s === 0) {
      const c = formData.company;
      if (!c.loadingDepot)             return "Please select a loading depot.";
      if (!c.name.trim())              return "Company name is required.";
      if (!c.dprRegNo.trim())          return "Marketer's License Number is required.";
      if (!c.cacRegNo.trim())          return "CAC Registration number is required.";
      if (!c.headOfficeAddress.trim()) return "Head office address is required.";
      if (!c.telephone.trim())         return "Company telephone is required.";
      if (!c.email.trim())             return "Company email is required.";
      if (!c.stationAddress.trim())    return "Station delivery address is required.";
    }
    if (s === 1) {
      const o = formData.owner;
      if (!o.name.trim())      return "Owner name is required.";
      if (!o.telephone.trim()) return "Owner telephone is required.";
      if (!o.address.trim())   return "Owner address is required.";
      if (!o.email.trim())     return "Owner email is required.";
      if (!o.officialIdType)   return "Please select an official ID type.";
      if (!o.idNumber.trim())  return "ID number is required.";
    }
    if (s === 2) {
      const p = formData.purchase;
      if (!p.productType)     return "Please select a product type.";
      if (!p.productQuantity) return "Please select a product quantity.";
      if (!p.haulageTruck)    return "Please select a haulage option.";
      if (p.haulageTruck === "Owned Truck") {
        if (!p.driverName.trim())   return "Driver name is required.";
        if (!p.driverIdType)        return "Please select driver ID type.";
        if (!p.driverIdNumber.trim()) return "Driver ID number is required.";
      }
    }
    if (s === 3) {
      if (!formData.payment.paymentMethod) return "Please select a payment method.";
    }
    return "";
  };

  const handleNext = () => {
    setSubmitError("");
    const err = validateStage(stage);
    if (err) { setSubmitError(err); return; }
    if (stage < 3) { setStage((s) => s + 1); return; }
    if (formData.payment.paymentMethod === "paystack") handlePaystack();
    else { submitOrder(generateOrderId()); }
  };
  const handleBack = () => { if (stage > 0) setStage((s) => s - 1); };
  const handleCopyId = () => { navigator.clipboard.writeText(orderId).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  const handleReset = () => {
    setSubmitted(false); setStage(0); setOrderId(""); setCopied(false);
    setFormData({ company: { name: "", dprRegNo: "", cacRegNo: "", headOfficeAddress: "", telephone: "", email: "", stationAddress: "", loadingDepot: "" }, owner: { name: "", telephone: "", address: "", email: "", officialIdType: "", idNumber: "" }, purchase: { productType: "", productQuantity: "", haulageTruck: "", driverName: "", driverIdType: "", driverIdNumber: "", selectedRentTruck: "", ownedTruck: { vehicleType: "", tankCapacity: "", ullage1: "", ullage2: "", ullage3: "", ullage4: "", ullage5: "", tractorColor: "", tankColor: "", truckRegNumber: "", bodyInscription: "", truckChart: "", calibrationChart: "", otherDetails: "" } }, payment: { paymentMethod: "", bankName: "", accountName: "", transactionRef: "" } });
  };

  return (
    <div className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: `url(${tower.src})` }}>
      <Head><title>Buy Now | e-Nergy</title></Head>
      <div className="absolute inset-0 bg-black/40" />
      <NavBar />
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 pt-24">
        
        {submitted ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border-4 border-orange-500 p-8 max-w-lg w-full text-center space-y-5">
            <div className="text-6xl">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800">Order Submitted!</h2>
            <p className="text-gray-500 text-sm">Your purchase order for <span className="font-semibold">{formData.company.name || "your company"}</span> has been received and is being processed.</p>
            <div className="rounded-lg border-2 border-orange-300 bg-orange-50 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-600">Your Unique Order ID</p>
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono font-black text-2xl text-gray-900 tracking-widest">{orderId}</span>
                <button onClick={handleCopyId} title="Copy to clipboard" className="text-orange-500 hover:text-orange-700 transition">
                  {copied
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5 text-green-500"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" strokeLinecap="round" /></svg>
                  }
                </button>
              </div>
              <p className="text-xs text-gray-500">Save this ID — you will need it to begin loading at the depot.</p>
            </div>
            <div className="text-left rounded-lg bg-gray-50 border border-gray-200 p-4 text-xs text-gray-600 space-y-1.5">
              <p className="font-bold text-gray-800 uppercase tracking-widest text-[10px] mb-2">What happens next?</p>
              <p>1. Our team will verify your payment within 48 hours.</p>
              <p>2. Once confirmed, proceed to the depot with your truck and driver.</p>
              <p>3. Use your Order ID on the <span className="font-semibold text-orange-600">Load</span> page to begin loading.</p>
              <p>4. A waybill / loading order will be generated for you to print.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/load" className="flex-1 py-3 bg-orange-500 text-white text-sm font-bold rounded hover:bg-orange-600 transition flex items-center justify-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3" strokeLinecap="round" /><rect x="9" y="11" width="14" height="10" rx="1" /><path d="M13 16h4M13 19h2" strokeLinecap="round" /></svg>
                Load Product →
              </Link>
              <button onClick={handleReset} className="flex-1 py-3 border-2 border-orange-300 text-orange-600 text-sm font-bold rounded hover:bg-orange-50 transition">
                Place Another Order
              </button>
            </div>
          </div>
        ) : (
          <div className="flex w-full max-w-5xl bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border-4 border-orange-500 overflow-hidden my-10">
            {isCustomer && (
              <div className="absolute top-20 left-4 z-10">
                <Link href="/customer/TransactionHistory" className="flex items-center gap-2 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 hover:border-orange-500/50 text-gray-300 hover:text-orange-400 text-xs font-semibold px-3 py-2 rounded-full shadow-lg backdrop-blur-sm transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Dashboard
                </Link>
              </div>
            )}
            <div className="hidden md:flex flex-col justify-center px-8 py-8 min-w-[240px] max-w-[260px] pt-0">
              <h1 className="text-gray-900 text-xl font-extrabold uppercase leading-snug mb-4">Welcome to<br />{platformInfo.platformName}</h1>
              <p className="text-gray-500 text-xs italic mb-8">Please be informed that purchases within 48 hours of order placement require prior authorization.</p>
              <div className="space-y-3">
                <div className="flex items-center gap-2"><span className="text-orange-500 text-lg">✉</span><span className="text-gray-600 text-xs">{platformInfo.supportEmail}</span></div>
                <div className="flex items-center gap-2"><span className="text-orange-500 text-lg">📞</span><span className="text-gray-600 text-xs">{platformInfo.supportPhone}</span></div>
              </div>
            </div>
            <div className="hidden md:block w-px bg-gray-200 my-6" />
            <div className="flex-1 p-6 md:p-8 overflow-y-auto" style={{ maxHeight: "85vh" }}>
              <StepIndicator current={stage} />
              {stage === 0 && <CompanyStage data={formData.company} onChange={updateCompany} />}
              {stage === 1 && <OwnerStage data={formData.owner} onChange={updateOwner} />}
              {stage === 2 && <PurchaseStage data={formData.purchase} onChange={updatePurchase} />}
              {stage === 3 && <PaymentStage data={formData.payment} onChange={updatePayment} bankSettings={bankSettings} availableMethods={PAYMENT_METHODS.filter(m => m.value === "bank-transfer" ? enabledMethods.enableBankTransfer : m.value === "opay" ? enabledMethods.enableOpay : enabledMethods.enablePaystack)} />}
              {submitError && <p className="text-sm text-red-500 text-center mt-4">{submitError}</p>}
              <div className="flex justify-between items-center mt-4 pt-6 border-t border-gray-100">
                {stage > 0 ? <button onClick={handleBack} className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition">‹ Back</button> : <div />}
                <button onClick={handleNext} disabled={submitting} className="px-6 py-2 bg-orange-500 text-white text-sm font-bold rounded hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                  {submitting ? "Submitting…" : stage === 3 ? (formData.payment.paymentMethod === "paystack" ? "Pay Now →" : formData.payment.paymentMethod ? "Proceed with Payment →" : "Submit Order") : "Next ›"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}