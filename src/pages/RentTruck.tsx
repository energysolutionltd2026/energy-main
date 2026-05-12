"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Head from "next/head";
import NavBar from "@/components/NavBar";
import FlowCompleteModal from "@/components/FlowCompleteModal";
import { useRateLimit } from "@/hooks/useRateLimit";
import { sanitizeString } from "@/lib/security/sanitize";
import { logTransaction } from "@/utils/logTransaction";
import Link from "next/link";
import tower from "@/../public/tower.jpg";
import { useDepot } from "@/context/DepotContext";
import truck1 from "@/../public/truck1.jpg";
import truck2 from "@/../public/truck2.jpg";
import truck3 from "@/../public/truck3.jpg";
import Select from "react-select";
import { getStates, getLgas } from "nigeria-state-lga-data";

const PAYSTACK_PUBLIC_KEY = "pk_test_REPLACE_WITH_YOUR_KEY";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TruckFilters {
  loadingDepot: string;
  capacity: string;
  vehicleType: string;
  productType: string;
  destinationState: string;
  destinationTown: string;
}

interface TruckListing {
  id: string;
  name: string;
  capacity: string;
  vehicleType: string;
  productTypes: string[];
  pricePerDay: number;
  image: any;
  available: boolean;
  features: string[];
}

interface TruckRegistration {
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  vehicleType: string;
  tankCapacity: string;
  compartments: string;
  truckRegNumber: string;
  tractorColor: string;
  tankColor: string;
  chassisNumber: string;
  engineNumber: string;
  yearOfManufacture: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceExpiry: string;
  dprCertNumber: string;
  dprCertExpiry: string;
  roadWorthinessExpiry: string;
  productTypes: string[];
  zoneRates: Record<string, number>;
  driverName: string;
  driverPhone: string;
  driverLicenseNumber: string;
  driverLicenseExpiry: string;
  motorBoyName: string;
  motorBoyPhone: string;
  motorBoyIdType: string;
  motorBoyIdNumber: string;
  destinationState: string;
  destinationTown: string;
  documents: {
    vehicleLicense: File | null;
    insurance: File | null;
    dprCert: File | null;
    roadWorthiness: File | null;
  };
  tractorImage: File | null;
  tankImage: File | null;
}

interface OwnerTruck {
  id: string;
  listingId?: string;
  name: string;
  vehicleType: string;
  capacity: string;
  regNumber: string;
  tractorColor: string;
  tankColor: string;
  chassisNumber: string;
  engineNumber: string;
  yearOfManufacture: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceExpiry: string;
  dprCertNumber: string;
  dprCertExpiry: string;
  roadWorthinessExpiry: string;
  productTypes: string[];
  dailyRate: number;
  driverName: string;
  driverPhone: string;
  driverLicenseNumber: string;
  driverLicenseExpiry: string;
  motorBoyName: string;
  motorBoyPhone: string;
  status: "approved" | "under_review" | "rejected";
  reviewNote?: string;
  submittedDate: string;
  approvedDate?: string;
}

const MOCK_TRUCK_OWNER = {
  name: "",
  email: "",
  phone: "",
  company: "",
  ownerId: "",
};

const INITIAL_OWNER_TRUCKS: OwnerTruck[] = [];


// ─── Mock Truck Database ──────────────────────────────────────────────────────

const MOCK_TRUCKS: TruckListing[] = [];

// ─── Nigerian States and LGAs (from nigeria-state-lga-data) ──────────────────

const NG_STATES = getStates().map((s: string) => ({ value: s, label: s }));
const getLgaOptions = (state: string) =>
  state ? getLgas(state).map((l: string) => ({ value: l, label: l })) : [];

// ─── Geopolitical Zones ───────────────────────────────────────────────────────

const GEO_ZONES: { name: string; states: string[] }[] = [
  { name: "North West",   states: ["Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Sokoto", "Zamfara"] },
  { name: "North East",   states: ["Adamawa", "Bauchi", "Borno", "Gombe", "Taraba", "Yobe"] },
  { name: "North Central",states: ["Benue", "FCT", "Kogi", "Kwara", "Nasarawa", "Niger", "Plateau"] },
  { name: "South West",   states: ["Ekiti", "Lagos", "Ogun", "Ondo", "Osun", "Oyo"] },
  { name: "South East",   states: ["Abia", "Anambra", "Ebonyi", "Enugu", "Imo"] },
  { name: "South South",  states: ["Akwa Ibom", "Bayelsa", "Cross River", "Delta", "Edo", "Rivers"] },
];

const STATE_PRICES: Record<string, number> = {
  // North West
  Jigawa: 200_000, Kaduna: 185_000, Kano: 190_000, Katsina: 195_000,
  Kebbi: 210_000, Sokoto: 215_000, Zamfara: 205_000,
  // North East
  Adamawa: 230_000, Bauchi: 220_000, Borno: 250_000, Gombe: 225_000,
  Taraba: 240_000, Yobe: 245_000,
  // North Central
  Benue: 180_000, FCT: 150_000, Kogi: 160_000, Kwara: 155_000,
  Nasarawa: 165_000, Niger: 175_000, Plateau: 185_000,
  // South West
  Ekiti: 100_000, Lagos: 85_000, Ogun: 90_000, Ondo: 105_000,
  Osun: 95_000, Oyo: 95_000,
  // South East
  Abia: 120_000, Anambra: 115_000, Ebonyi: 130_000, Enugu: 125_000, Imo: 120_000,
  // South South
  "Akwa Ibom": 140_000, Bayelsa: 145_000, "Cross River": 135_000,
  Delta: 120_000, Edo: 115_000, Rivers: 125_000,
};

const inputClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition placeholder-gray-400 bg-white";
const selectClass = "w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition bg-white";

const Field = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-xs font-semibold tracking-widest text-gray-500 uppercase">{label}</label>
    {children}
  </div>
);

// ─── Truck Card Component ─────────────────────────────────────────────────────

const TruckCard = ({ truck, onSelect }: { truck: TruckListing; onSelect: () => void }) => (
  <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden hover:border-orange-400 transition-all duration-300">
    <div className="relative h-48">
      <Image src={truck.image} alt={truck.name} fill className="object-cover" />
      <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
        {truck.capacity}L
      </div>
    </div>
    
    <div className="p-4 space-y-3">
      <div>
        <h3 className="font-bold text-lg text-gray-900">{truck.name}</h3>
        <p className="text-xs text-gray-500 uppercase tracking-wide">{truck.vehicleType}</p>
      </div>

      <div className="flex flex-wrap gap-1">
        {truck.productTypes.map((type) => (
          <span key={type} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
            {type}
          </span>
        ))}
      </div>

      <div className="space-y-1">
        {truck.features.map((feature, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {feature}
          </div>
        ))}
      </div>

      <div className="border-t pt-3 flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500">Daily Rate</p>
          <p className="text-lg font-black text-orange-600">₦{truck.pricePerDay.toLocaleString()}</p>
        </div>
        <button
          onClick={onSelect}
          className="px-4 py-2 rounded font-bold text-sm transition-all bg-orange-500 text-white hover:bg-orange-600 active:scale-95"
        >
          Select Truck
        </button>
      </div>
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Edit Modal Helpers ───────────────────────────────────────────────────────

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pb-1 border-b border-gray-100">
      {title}
    </h3>
    {children}
  </div>
);

const EditField = ({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition bg-white"
    />
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RentTruck() {
  const { depots } = useDepot();
  const [activeTab, setActiveTab] = useState<"rent" | "register">("rent");
  const [tractorPreview, setTractorPreview] = useState<string | null>(null);
  const [tankPreview, setTankPreview] = useState<string | null>(null);
  const tractorInputRef = useRef<HTMLInputElement>(null);
  const tankInputRef = useRef<HTMLInputElement>(null);
  const [isCustomer, setIsCustomer] = useState(false);

   useEffect(() => {
     fetch("/api/auth/me")
       .then((r) => (r.ok ? r.json() : null))
       .then((data) => {
         const u = data?.user;
         if (!u) return;
         if (u.role === "customer") setIsCustomer(true);
         setRegistration((prev) => ({
           ...prev,
           ownerName: u.name || "",
           ownerEmail: u.email || "",
           ownerPhone: u.phone || "",
         }));
         setRentBook((prev) => ({
           ...prev,
           fullName: u.name || "",
           phone: u.phone || "",
           email: u.email || "",
         }));
       })
       .catch(() => null);
   }, []);

   useEffect(() => {
     if (document.getElementById("paystack-script")) return;
     const script = document.createElement("script");
     script.id = "paystack-script";
     script.src = "https://js.paystack.co/v1/inline.js";
     script.async = true;
     document.body.appendChild(script);
   }, []);


  const handleImageChange = (
    field: "tractorImage" | "tankImage",
    setPreview: (url: string | null) => void,
    file: File | null
  ) => {
    updateRegistration(field, file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const [rentStep, setRentStep] = useState<1|2|3|4>(1);
  const [showFlowModal, setShowFlowModal] = useState(false);
  const [lastBookingRef, setLastBookingRef] = useState("");
  const [bookingError, setBookingError] = useState("");
  const rateLimit = useRateLimit({ maxAttempts: 5, windowMs: 60_000 });
  const [rentBook, setRentBook] = useState({
    depot: "", capacity: "", vehicleType: "", productType: "",
    zone: "", state: "", lga: "",
    fullName: "", phone: "", email: "", company: "",
    destinationAddress: "",
    pickupDate: "", rentalDays: "1", notes: "",
    paymentMethod: "",
  });

  const [registration, setRegistration] = useState<TruckRegistration>({
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    vehicleType: "",
    tankCapacity: "",
    compartments: "",
    truckRegNumber: "",
    tractorColor: "",
    tankColor: "",
    chassisNumber: "",
    engineNumber: "",
    yearOfManufacture: "",
    insuranceProvider: "",
    insurancePolicyNumber: "",
    insuranceExpiry: "",
    dprCertNumber: "",
    dprCertExpiry: "",
    roadWorthinessExpiry: "",
    productTypes: [],
    zoneRates: {},
    driverName: "",
    driverPhone: "",
    driverLicenseNumber: "",
    driverLicenseExpiry: "",
    motorBoyName: "",
    motorBoyPhone: "",
    motorBoyIdType: "",
    motorBoyIdNumber: "",
    destinationState: "",
    destinationTown: "",
    documents: {
      vehicleLicense: null,
      insurance: null,
      dprCert: null,
      roadWorthiness: null,
    },
    tractorImage: null,
    tankImage: null,
  });

  const updateRegistration = (key: keyof TruckRegistration, value: any) => {
    setRegistration((prev) => ({ ...prev, [key]: value }));
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || "");
      reader.readAsDataURL(file);
    });

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();

    const tractorImageUrl = registration.tractorImage ? await fileToBase64(registration.tractorImage) : "";
    const tankImageUrl = registration.tankImage ? await fileToBase64(registration.tankImage) : "";

    setTractorPreview(null);
    setTankPreview(null);
    if (tractorInputRef.current) tractorInputRef.current.value = "";
    if (tankInputRef.current) tankInputRef.current.value = "";

    // Build submission record for DB
    const newId = `TRK-${Date.now()}`;
    const ownerId = `OWN-${Date.now()}`;
    const adminRecord = {
      id: newId,
      ownerName: registration.ownerName || truckOwner?.name || "Truck Owner",
      ownerEmail: registration.ownerEmail || truckOwner?.email || "",
      ownerPhone: registration.ownerPhone || truckOwner?.phone || "",
      vehicleType: registration.vehicleType,
      tankCapacity: registration.tankCapacity ? `${registration.tankCapacity} L` : "",
      compartments: registration.compartments,
      truckRegNumber: registration.truckRegNumber,
      tractorColor: registration.tractorColor,
      tankColor: registration.tankColor,
      chassisNumber: registration.chassisNumber,
      engineNumber: registration.engineNumber,
      yearOfManufacture: registration.yearOfManufacture,
      insuranceProvider: registration.insuranceProvider,
      insurancePolicyNumber: registration.insurancePolicyNumber,
      insuranceExpiry: registration.insuranceExpiry,
      dprCertNumber: registration.dprCertNumber,
      dprCertExpiry: registration.dprCertExpiry,
      roadWorthinessExpiry: registration.roadWorthinessExpiry,
      productTypes: registration.productTypes.map((p) => p.split(" ")[0]),
      zoneRates: registration.zoneRates,
      driverName: registration.driverName,
      driverPhone: registration.driverPhone,
      driverLicenseNumber: registration.driverLicenseNumber,
      driverLicenseExpiry: registration.driverLicenseExpiry,
      motorBoyName: registration.motorBoyName,
      motorBoyPhone: registration.motorBoyPhone,
      motorBoyIdType: registration.motorBoyIdType,
      motorBoyIdNumber: registration.motorBoyIdNumber,
      status: "Pending Review",
      submittedAt: new Date().toISOString().split("T")[0],
      reviewNote: "",
      destinationState: registration.destinationState,
      destinationTown: registration.destinationTown,
      tractorImageUrl,
      tankImageUrl,
    };
    // Persist to DB
    import("@/lib/db-client").then(({ api }) => {
      api.trucks.create({
        ownerName:          adminRecord.ownerName,
        ownerEmail:         adminRecord.ownerEmail,
        ownerPhone:         adminRecord.ownerPhone,
        vehicleType:        adminRecord.vehicleType,
        truckRegNumber:     adminRecord.truckRegNumber,
        tankCapacity:       registration.tankCapacity ? Number(registration.tankCapacity) : 1,
        compartments:       adminRecord.compartments,
        productTypes:       adminRecord.productTypes,
        zoneRates:          adminRecord.zoneRates,
        dailyRate:          0,
        tractorColor:       adminRecord.tractorColor,
        tankColor:          adminRecord.tankColor,
        chassisNumber:      adminRecord.chassisNumber,
        engineNumber:       adminRecord.engineNumber,
        yearOfManufacture:  adminRecord.yearOfManufacture,
        insuranceProvider:  adminRecord.insuranceProvider,
        insurancePolicyNumber: adminRecord.insurancePolicyNumber,
        insuranceExpiry:    adminRecord.insuranceExpiry,
        dprCertNumber:      adminRecord.dprCertNumber,
        dprCertExpiry:      adminRecord.dprCertExpiry,
        roadWorthinessExpiry: adminRecord.roadWorthinessExpiry,
        driverName:         adminRecord.driverName || "TBD",
        driverPhone:        adminRecord.driverPhone,
        driverLicenseNumber: adminRecord.driverLicenseNumber,
        driverLicenseExpiry: adminRecord.driverLicenseExpiry,
        motorBoyName:       adminRecord.motorBoyName,
        motorBoyPhone:      adminRecord.motorBoyPhone,
        motorBoyIdType:     adminRecord.motorBoyIdType,
        motorBoyIdNumber:   adminRecord.motorBoyIdNumber,
        tractorImageUrl:    tractorImageUrl,
        tankImageUrl:       tankImageUrl,
        destinationState:   adminRecord.destinationState,
        destinationTown:    adminRecord.destinationTown,
      } as any).catch(() => null);
    });

    // Add to owner's truck list as under_review
    const ownerRecord: OwnerTruck = {
      id: ownerId, listingId: newId,
      name: registration.truckRegNumber || "New Truck",
      vehicleType: registration.vehicleType, capacity: registration.tankCapacity,
      regNumber: registration.truckRegNumber, tractorColor: registration.tractorColor,
      tankColor: registration.tankColor, chassisNumber: registration.chassisNumber,
      engineNumber: registration.engineNumber, yearOfManufacture: registration.yearOfManufacture,
      insuranceProvider: registration.insuranceProvider,
      insurancePolicyNumber: registration.insurancePolicyNumber,
      insuranceExpiry: registration.insuranceExpiry, dprCertNumber: registration.dprCertNumber,
      dprCertExpiry: registration.dprCertExpiry, roadWorthinessExpiry: registration.roadWorthinessExpiry,
      productTypes: registration.productTypes, dailyRate: Object.values(registration.zoneRates)[0] || 0,
      driverName: registration.driverName, driverPhone: registration.driverPhone,
      driverLicenseNumber: registration.driverLicenseNumber, driverLicenseExpiry: registration.driverLicenseExpiry,
      motorBoyName: registration.motorBoyName, motorBoyPhone: registration.motorBoyPhone,
      status: "under_review", submittedDate: new Date().toISOString().split("T")[0],
    };
    setOwnerTrucks((prev) => [...prev, ownerRecord]);

    alert("Registration submitted successfully! Our team will review and contact you within 24-48 hours.");
    // Reset form
    setRegistration({
      ownerName: "",
      ownerPhone: "",
      ownerEmail: "",
      vehicleType: "",
      tankCapacity: "",
      compartments: "",
      truckRegNumber: "",
      tractorColor: "",
      tankColor: "",
      chassisNumber: "",
      engineNumber: "",
      yearOfManufacture: "",
      insuranceProvider: "",
      insurancePolicyNumber: "",
      insuranceExpiry: "",
      dprCertNumber: "",
      dprCertExpiry: "",
      roadWorthinessExpiry: "",
      productTypes: [],
      zoneRates: {},
      driverName: "",
      driverPhone: "",
      driverLicenseNumber: "",
      driverLicenseExpiry: "",
      motorBoyName: "",
      motorBoyPhone: "",
      motorBoyIdType: "",
      motorBoyIdNumber: "",
      destinationState: "",
      destinationTown: "",
      documents: {
        vehicleLicense: null,
        insurance: null,
        dprCert: null,
        roadWorthiness: null,
      },
      tractorImage: null,
      tankImage: null,
    });
  };

  const toggleProductType = (type: string) => {
    setRegistration((prev) => ({
      ...prev,
      productTypes: prev.productTypes.includes(type)
        ? prev.productTypes.filter((t) => t !== type)
        : [...prev.productTypes, type],
    }));
  };

  const [showLoginSlide, setShowLoginSlide] = useState(false);
  const [truckOwner, setTruckOwner] = useState<typeof MOCK_TRUCK_OWNER | null>(null);
  const [showOwnerRegister, setShowOwnerRegister] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [ownerTrucks, setOwnerTrucks] = useState<OwnerTruck[]>([]);
  const [selectedOwnerTruck, setSelectedOwnerTruck] = useState<OwnerTruck | null>(null);
  const [editForm, setEditForm] = useState<OwnerTruck | null>(null);

  const handleTruckOwnerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    import("@/lib/db-client").then(({ api }) => {
      api.auth.login({ email: loginForm.email, password: loginForm.password }).then((result) => {
        if (result?.user && result.user.role === "truck_owner") {
          setTruckOwner({ name: result.user.name || "", email: result.user.email || "", phone: (result.user as any).phone || "", company: (result.user as any).companyName || "", ownerId: result.user._id || "" });
          setShowLoginSlide(false);
          setLoginError("");
          setLoginForm({ email: "", password: "" });
        } else if (result?.user) {
          setLoginError("This account is not registered as a truck owner.");
        } else {
          setLoginError("Invalid email or password.");
        }
      }).catch(() => setLoginError("Login failed. Please try again."));
    });
  };

  const handleSaveTruck = () => {
    if (!editForm) return;
    setOwnerTrucks((prev) => prev.map((t) => (t.id === editForm.id ? editForm : t)));
    setSelectedOwnerTruck(null);
    setEditForm(null);
  };

  const saveRentalBooking = (reference: string) => {
    const price = STATE_PRICES[rentBook.state] || 0;
    const days = Number(rentBook.rentalDays || 1);
    const total = price * days;
    logTransaction({
      type: "Truck Rental",
      user: rentBook.fullName || "Customer",
      userRole: "Customer",
      product: `Truck to ${rentBook.state}`,
      quantity: `${days} day(s)`,
      totalAmount: `₦${total.toLocaleString()}`,
      status: "Pending",
      paymentMethod: rentBook.paymentMethod,
      depot: rentBook.depot,
      reference,
    });
  };

  const handlePaystack = () => {
    // @ts-ignore
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: rentBook.email || "guest@energy.ng",
      amount: (STATE_PRICES[rentBook.state] || 0) * Number(rentBook.rentalDays || 1) * 100,
      currency: "NGN",
      ref: `RNT-${Date.now()}`,
      metadata: {
        customerName: rentBook.fullName,
        phone: rentBook.phone,
        depot: rentBook.depot,
        truck: `${rentBook.capacity}L ${rentBook.vehicleType}`,
        rentalDays: rentBook.rentalDays,
      },
      onClose: () => {},
      callback: (response: { reference: string }) => {
        const ref = `ENR-RNT-${Date.now()}`;
        saveRentalBooking(ref);
        setLastBookingRef(ref);
        setShowFlowModal(true);
        setRentStep(1);
        setRentBook({ depot: "", capacity: "", vehicleType: "", productType: "", zone: "", state: "", lga: "", fullName: "", phone: "", email: "", company: "", destinationAddress: "", pickupDate: "", rentalDays: "1", notes: "", paymentMethod: "" });
      },
    });
    handler.openIframe();
  };

  const handleConfirmBooking = () => {
    setBookingError("");
    if (!rentBook.paymentMethod) { setBookingError("Please select a payment method."); return; }
    if (!rateLimit.attempt()) {
      setBookingError(`Too many attempts. Please wait ${Math.ceil(rateLimit.remainingMs / 1000)}s.`);
      return;
    }
    if (rentBook.paymentMethod === "paystack") {
      handlePaystack();
    } else {
      const safeRef = `ENR-RNT-${Date.now()}`;
      const safeName = sanitizeString(rentBook.fullName);
      const safePhone = sanitizeString(rentBook.phone);
      const safeCompany = sanitizeString(rentBook.company);
      const safeAddr = sanitizeString(rentBook.destinationAddress);
      void safeName; void safePhone; void safeCompany; void safeAddr; // used by backend when wired
      saveRentalBooking(safeRef);
      setLastBookingRef(safeRef);
      setShowFlowModal(true);
      setRentStep(1);
      setRentBook({ depot: "", capacity: "", vehicleType: "", productType: "", zone: "", state: "", lga: "", fullName: "", phone: "", email: "", company: "", destinationAddress: "", pickupDate: "", rentalDays: "1", notes: "", paymentMethod: "" });
    }
  };

  useEffect(() => {
    if (!truckOwner) return;
    import("@/lib/db-client").then(({ api }) => {
      api.trucks.list({ ownerEmail: truckOwner.email } as any).then((result: any) => {
        if (result?.data?.length) setOwnerTrucks(result.data);
      }).catch(() => null);
    }).catch(() => null);
  }, [truckOwner]);

  // When a truck owner logs in, auto-fill their profile into the register form
  useEffect(() => {
    if (!truckOwner) return;
    setRegistration((prev) => ({
      ...prev,
      ownerName: truckOwner.name,
      ownerEmail: truckOwner.email,
      ownerPhone: truckOwner.phone,
    }));
  }, [truckOwner]);


  return (
    <div className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat relative" style={{ backgroundImage: `url(${tower.src})` }}>
      <Head><title>Rent a Truck | e-Nergy</title></Head>
      <div className="absolute inset-0 bg-black/40" />
      <NavBar />

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-6 pt-24">
        
        <div className="flex w-full max-w-6xl bg-white/95 backdrop-blur-sm rounded-lg shadow-2xl border-4 border-orange-500 overflow-hidden my-10">
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
          {/* Left Sidebar */}
          <div className="hidden md:flex flex-col px-8 py-8 min-w-[240px] max-w-[260px] justify-between">
            <br />
            <div>
              <h1 className="text-gray-900 text-xl font-extrabold uppercase leading-snug mb-4">
                Truck<br />Rental &<br />Registration<br />Portal
              </h1>

              {truckOwner ? (
                <div className="mb-6 space-y-3">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Logged in as</p>
                    <p className="font-semibold text-gray-800 text-sm">{truckOwner.name}</p>
                    <p className="text-xs text-gray-500">{truckOwner.company}</p>
                    <p className="text-xs text-gray-400 font-mono">{truckOwner.ownerId}</p>
                  </div>
                  <button
                    onClick={() => setTruckOwner(null)}
                    className="w-full py-2 border-2 border-gray-300 text-gray-600 text-sm font-semibold rounded-lg hover:border-red-400 hover:text-red-500 transition"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-gray-600 text-xs mb-2 font-medium">Already registered your truck?</p>
                  <button
                    onClick={() => setShowLoginSlide((v) => !v)}
                    className="w-full py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Truck Owner Login
                  </button>

                  {/* Sliding login form */}
                  <div className={`overflow-hidden transition-all duration-300 ${showLoginSlide ? "max-h-64 mt-3" : "max-h-0"}`}>
                    <form onSubmit={handleTruckOwnerLogin} className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Owner Login</p>
                      {loginError && (
                        <p className="text-xs text-red-500 font-medium">{loginError}</p>
                      )}
                      <div>
                        <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Email</label>
                        <input
                          type="email"
                          required
                          className="mt-1 w-full border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-orange-500 bg-white"
                          placeholder="owner@example.com"
                          value={loginForm.email}
                          onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Password</label>
                        <input
                          type="password"
                          required
                          className="mt-1 w-full border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-orange-500 bg-white"
                          placeholder="••••••••"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2 bg-orange-500 text-white text-xs font-bold rounded hover:bg-orange-600 transition"
                      >
                        Login →
                      </button>
                    </form>
                  </div>
                </div>
              )}

              <p className="text-gray-500 text-xs italic mb-6">
                Rent premium trucks for your petroleum logistics or register your truck to earn passive income.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-orange-500 text-lg">✉</span>
                <span className="text-gray-600 text-xs">trucks@pipesandbarrels.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-500 text-lg">📞</span>
                <span className="text-gray-600 text-xs">(+234) 08087550875</span>
              </div>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="hidden md:block w-px bg-gray-200 my-6" />

          {/* Main Content */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto" style={{ maxHeight: "85vh" }}>


            {truckOwner && !showOwnerRegister ? (
            /* ── TRUCK OWNER DASHBOARD ── */
            <div className="space-y-8">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">My Trucks</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your registered trucks and track review status.</p>
                </div>
                <button
                  onClick={() => setShowOwnerRegister(true)}
                  className="px-4 py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition"
                >
                  + Register New Truck
                </button>
              </div>

              {/* Approved Trucks */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  <h3 className="font-bold text-gray-800 text-base uppercase tracking-wider">Approved Trucks</h3>
                  <span className="ml-1 text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                    {ownerTrucks.filter((t) => t.status === "approved").length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ownerTrucks.filter((t) => t.status === "approved").map((truck) => (
                    <div
                      key={truck.id}
                      onClick={() => { setSelectedOwnerTruck(truck); setEditForm({ ...truck }); }}
                      className="bg-white border-2 border-green-200 rounded-xl p-5 cursor-pointer hover:border-green-400 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900 group-hover:text-orange-600 transition">{truck.name}</h4>
                          <p className="text-xs text-gray-500">{truck.vehicleType} · {truck.capacity}L</p>
                        </div>
                        <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-300">
                          ✓ Approved
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-y-1 text-xs text-gray-600">
                        <span className="text-gray-400">Reg No.</span><span className="font-mono font-medium">{truck.regNumber}</span>
                        <span className="text-gray-400">Daily Rate</span><span className="font-semibold text-orange-600">₦{truck.dailyRate.toLocaleString()}</span>
                        <span className="text-gray-400">Driver</span><span>{truck.driverName}</span>
                        <span className="text-gray-400">Approved</span><span>{truck.approvedDate}</span>
                      </div>
                      <p className="text-xs text-orange-500 font-semibold mt-3 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Click to view &amp; edit details
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Under Review Trucks */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                  <h3 className="font-bold text-gray-800 text-base uppercase tracking-wider">Under Review</h3>
                  <span className="ml-1 text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full">
                    {ownerTrucks.filter((t) => t.status === "under_review").length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ownerTrucks.filter((t) => t.status === "under_review").map((truck) => (
                    <div key={truck.id} className="bg-white border-2 border-yellow-200 rounded-xl p-5 opacity-80">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-gray-900">{truck.name}</h4>
                          <p className="text-xs text-gray-500">{truck.vehicleType} · {truck.capacity}L</p>
                        </div>
                        <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-300">
                          ⏳ Under Review
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-y-1 text-xs text-gray-600">
                        <span className="text-gray-400">Reg No.</span><span className="font-mono font-medium">{truck.regNumber}</span>
                        <span className="text-gray-400">Proposed Rate</span><span className="font-semibold">₦{truck.dailyRate.toLocaleString()}</span>
                        <span className="text-gray-400">Submitted</span><span>{truck.submittedDate}</span>
                        <span className="text-gray-400">Status</span><span className="text-yellow-600 font-semibold">Awaiting approval</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-3 italic">This truck will appear in the rental listing once approved.</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejected Trucks */}
              {ownerTrucks.filter((t) => t.status === "rejected").length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <h3 className="font-bold text-gray-800 text-base uppercase tracking-wider">Rejected</h3>
                    <span className="ml-1 text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                      {ownerTrucks.filter((t) => t.status === "rejected").length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ownerTrucks.filter((t) => t.status === "rejected").map((truck) => (
                      <div key={truck.id} className="bg-white border-2 border-red-200 rounded-xl p-5 opacity-80">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-bold text-gray-900">{truck.name}</h4>
                            <p className="text-xs text-gray-500">{truck.vehicleType} · {truck.capacity}L</p>
                          </div>
                          <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-300">
                            ✕ Rejected
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-y-1 text-xs text-gray-600">
                          <span className="text-gray-400">Reg No.</span><span className="font-mono font-medium">{truck.regNumber}</span>
                          <span className="text-gray-400">Submitted</span><span>{truck.submittedDate}</span>
                        </div>
                        {truck.reviewNote && (
                          <p className="text-xs text-red-600 font-semibold mt-3 bg-red-50 border border-red-200 rounded p-2">
                            Reason: {truck.reviewNote}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-2 italic">Please address the issues above and register again.</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
          {/* Back button for truck owners accessing the register form */}
          {truckOwner && showOwnerRegister && (
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setShowOwnerRegister(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-300 transition"
              >
                ← Back to My Trucks
              </button>
              <h2 className="text-xl font-bold text-gray-900">Register New Truck</h2>
            </div>
          )}

          {/* Tab Switcher — hidden when truck owner is registering */}
          {!showOwnerRegister && <div className="flex justify-center mb-8">
              <div className="inline-flex bg-white rounded-lg shadow-md p-1 border-2 border-orange-200">
                <button
                  onClick={() => setActiveTab("rent")}
                  className={`px-6 py-3 rounded-md font-bold text-sm transition-all ${
                    activeTab === "rent"
                      ? "bg-orange-500 text-white shadow-md"
                      : "text-gray-600 hover:text-orange-500"
                  }`}
                >
                  🚚 Rent a Truck
                </button>
                <button
                  onClick={() => setActiveTab("register")}
                  className={`px-6 py-3 rounded-md font-bold text-sm transition-all ${
                    activeTab === "register"
                      ? "bg-orange-500 text-white shadow-md"
                      : "text-gray-600 hover:text-orange-500"
                  }`}
                >
                  📝 Register Your Truck
                </button>
              </div>
            </div>}

          {/* ─── RENT TAB ─── */}
          {activeTab === "rent" && (
            <div className="space-y-6">

              {/* Step Indicator */}
              <div className="flex items-center justify-center">
                {([
                  { n: 1, label: "Truck Details" },
                  { n: 2, label: "Destination" },
                  { n: 3, label: "Your Details" },
                  { n: 4, label: "Payment" },
                ] as const).map(({ n, label }, i, arr) => (
                  <React.Fragment key={n}>
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                        ${rentStep > n ? "bg-orange-500 border-orange-500 text-white" :
                          rentStep === n ? "bg-orange-500 border-orange-500 text-white ring-4 ring-orange-100" :
                          "bg-white border-gray-300 text-gray-400"}`}>
                        {rentStep > n ? "✓" : n}
                      </div>
                      <span className={`text-[10px] font-semibold whitespace-nowrap ${rentStep === n ? "text-orange-500" : "text-gray-400"}`}>{label}</span>
                    </div>
                    {i < arr.length - 1 && <div className={`h-0.5 w-10 mb-4 mx-1 ${rentStep > n ? "bg-orange-500" : "bg-gray-200"}`} />}
                  </React.Fragment>
                ))}
              </div>

              {/* ── Step 1: Truck Details ── */}
              {rentStep === 1 && (
                <div className="bg-white rounded-xl shadow-lg border-2 border-orange-200 p-6 space-y-5">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">1</span>
                    Truck Details
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Loading Depot" className="md:col-span-2">
                      <select className={selectClass} value={rentBook.depot} onChange={e => setRentBook(p => ({ ...p, depot: e.target.value }))}>
                        <option value="">— Select Depot —</option>
                        {depots.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </Field>
                    <Field label="Tank Capacity">
                      <select className={selectClass} value={rentBook.capacity} onChange={e => setRentBook(p => ({ ...p, capacity: e.target.value }))}>
                        <option value="33,000">33,000 Litres</option>
                        <option value="45,000">45,000 Litres</option>
                        <option value="60,000">60,000 Litres</option>
                        <option value="100,000">100,000 Litres</option>
                      </select>
                    </Field>
                    <Field label="Vehicle Type">
                      <select className={selectClass} value={rentBook.vehicleType} onChange={e => setRentBook(p => ({ ...p, vehicleType: e.target.value }))}>
                        <option value="Articulated Tanker">Articulated Tanker</option>
                        <option value="Rigid Tanker">Rigid Tanker</option>
                        <option value="Mini Tanker">Mini Tanker</option>
                      </select>
                    </Field>
                    <Field label="Product Type" className="md:col-span-2">
                      <select className={selectClass} value={rentBook.productType} onChange={e => setRentBook(p => ({ ...p, productType: e.target.value }))}>
                        <option value="PMS">PMS (Petrol)</option>
                        <option value="AGO">AGO (Diesel)</option>
                        <option value="ATK">ATK (Jet Fuel)</option>
                        <option value="LPG">LPG (Gas)</option>
                      </select>
                    </Field>
                  </div>
                  <button
                    onClick={() => { if (!rentBook.depot) { alert("Please select a loading depot"); return; } setRentStep(2); }}
                    className="w-full py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-all active:scale-95"
                  >
                    Next: Select Destination →
                  </button>
                </div>
              )}

              {/* ── Step 2: Destination & Price ── */}
              {rentStep === 2 && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl shadow-lg border-2 border-orange-200 p-6 space-y-5">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">2</span>
                      Select Destination
                    </h2>

                    {/* Geo Zone Cards */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Geopolitical Zone</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {GEO_ZONES.map(z => (
                          <button key={z.name} type="button"
                            onClick={() => setRentBook(p => ({ ...p, zone: z.name, state: "", lga: "" }))}
                            className={`px-3 py-3 rounded-xl border-2 text-left transition-all
                              ${rentBook.zone === z.name ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-300"}`}>
                            <p className={`text-sm font-bold ${rentBook.zone === z.name ? "text-orange-700" : "text-gray-800"}`}>{z.name}</p>
                            <p className="text-[10px] text-gray-400 font-normal mt-0.5">{z.states.length} states</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* State Pills */}
                    {rentBook.zone && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Select State</p>
                        <div className="flex flex-wrap gap-2">
                          {GEO_ZONES.find(z => z.name === rentBook.zone)?.states.map(st => (
                            <button key={st} type="button"
                              onClick={() => setRentBook(p => ({ ...p, state: st, lga: "" }))}
                              className={`px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all
                                ${rentBook.state === st ? "border-orange-500 bg-orange-500 text-white" : "border-gray-200 hover:border-orange-400 text-gray-700"}`}>
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

                    {/* LGA Dropdown */}
                    {rentBook.state && (
                      <Field label="Select LGA">
                        <select className={selectClass} value={rentBook.lga}
                          onChange={e => setRentBook(p => ({ ...p, lga: e.target.value }))}>
                          <option value="">— Select LGA —</option>
                          {getLgas(rentBook.state).map((l: string) => <option key={l} value={l}>{l}</option>)}
                        </select>
                      </Field>
                    )}

                    {/* Price Banner */}
                    {rentBook.state && STATE_PRICES[rentBook.state] && (
                      <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Estimated Trip Price</p>
                        <p className="text-3xl font-black text-orange-600">₦{STATE_PRICES[rentBook.state].toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">Base rate for {rentBook.state} ({rentBook.zone}) · Final price confirmed after booking.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setRentStep(1)} className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition">← Back</button>
                    <button
                      onClick={() => { if (!rentBook.state) { alert("Please select a destination state"); return; } setRentStep(3); }}
                      className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition"
                    >
                      Next: Your Details →
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 3: Your Details ── */}
              {rentStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl shadow-lg border-2 border-orange-200 p-6 space-y-5">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">3</span>
                      Your Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Full Name">
                        <input className={inputClass} placeholder="Enter your full name" value={rentBook.fullName}
                          onChange={e => setRentBook(p => ({ ...p, fullName: e.target.value }))} />
                      </Field>
                      <Field label="Phone Number">
                        <input className={inputClass} placeholder="+234 xxx xxx xxxx" value={rentBook.phone}
                          onChange={e => setRentBook(p => ({ ...p, phone: e.target.value }))} />
                      </Field>
                       <Field label="Email Address (optional)">
                         <input className={inputClass} type="email" placeholder="you@example.com" value={rentBook.email}
                           onChange={e => setRentBook(p => ({ ...p, email: e.target.value }))} />
                       </Field>
                       <Field label="Station / Organisation name">
                         <input className={inputClass} placeholder="e.g. Sunrise Filling Station" value={rentBook.company}
                           onChange={e => setRentBook(p => ({ ...p, company: e.target.value }))} />
                       </Field>
                       <Field label="Destination Address" className="md:col-span-2">
                         <input className={inputClass} placeholder="Enter delivery destination address" value={rentBook.destinationAddress}
                           onChange={e => setRentBook(p => ({ ...p, destinationAddress: e.target.value }))} />
                       </Field>
                       <Field label="Additional Notes (optional)" className="md:col-span-2">
                         <textarea className={inputClass} rows={3} placeholder="Any special requirements..."
                           value={rentBook.notes} onChange={e => setRentBook(p => ({ ...p, notes: e.target.value }))} />
                       </Field>
                    </div>

                    {rentBook.state && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost Summary</p>
                        <div className="flex justify-between text-sm text-gray-700">
                          <span>Base rate — {rentBook.state}</span>
                          <span className="font-semibold">₦{(STATE_PRICES[rentBook.state] || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                          <span className="text-gray-600">Total</span>
                          <span className="font-black text-orange-600 text-base">₦{(STATE_PRICES[rentBook.state] || 0).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-gray-400">Final amount may be adjusted after confirmation.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setRentStep(2)} className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition">← Back</button>
                    <button
                        onClick={() => {
                          if (!rentBook.fullName || !rentBook.phone) { alert("Please fill in your name and phone number"); return; }
                          setRentStep(4);
                        }}
                      className="flex-1 py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition"
                    >
                      Next: Payment →
                    </button>
                  </div>
                </div>
              )}

              {/* ── Step 4: Payment ── */}
              {rentStep === 4 && (
                <div className="space-y-4">
                  <div className="bg-white rounded-xl shadow-lg border-2 border-orange-200 p-6 space-y-5">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">4</span>
                      Payment
                    </h2>

                    {/* Amount Due */}
                    <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Amount Due</p>
                        <p className="text-3xl font-black text-orange-600">
                          ₦{((STATE_PRICES[rentBook.state] || 0) * Number(rentBook.rentalDays || 1)).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{rentBook.state} · {rentBook.rentalDays} day{Number(rentBook.rentalDays) !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500 space-y-0.5">
                        <p className="font-semibold text-gray-700">{rentBook.fullName}</p>
                        <p>{rentBook.depot}</p>
                        <p>{rentBook.zone} · {rentBook.state}{rentBook.lga ? ` · ${rentBook.lga}` : ""}</p>
                      </div>
                    </div>

                     {/* Payment Method Selection */}
                     <div>
                       <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Select Payment Method</p>
                       <div className="grid grid-cols-1 gap-3">
                         {([
                           { id: "bank_transfer", label: "Bank Transfer",       desc: "Direct bank transfer to our account",   icon: "🏦" },
                           { id: "card",          label: "Debit / Credit Card",  desc: "Visa, Mastercard, Verve",               icon: "💳" },
                           { id: "paystack",      label: "Paystack",             desc: "Pay securely via Paystack",             icon: "🔷" },
                           { id: "opay",          label: "OPay",                 desc: "Pay via OPay mobile money",             icon: "📱" },
                         ] as const).map(method => (
                           <button key={method.id} type="button"
                             onClick={() => setRentBook(p => ({ ...p, paymentMethod: method.id }))}
                             className={`flex items-center gap-4 px-4 py-3 rounded-xl border-2 text-left transition-all
                               ${rentBook.paymentMethod === method.id ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-300"}`}>
                             <span className="text-2xl">{method.icon}</span>
                             <div className="flex-1">
                               <p className={`text-sm font-bold ${rentBook.paymentMethod === method.id ? "text-orange-700" : "text-gray-800"}`}>{method.label}</p>
                               <p className="text-xs text-gray-500">{method.desc}</p>
                             </div>
                             <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                               ${rentBook.paymentMethod === method.id ? "border-orange-500 bg-orange-500" : "border-gray-300"}`}>
                               {rentBook.paymentMethod === method.id && <span className="text-white text-[10px]">✓</span>}
                             </div>
                           </button>
                         ))}
                       </div>
                     </div>

                     {/* Bank Transfer Details */}
                     {rentBook.paymentMethod === "bank_transfer" && (
                       <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
                         <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Bank Transfer Details</p>
                         <div className="grid grid-cols-2 gap-y-1 text-sm">
                           <span className="text-gray-500">Bank</span><span className="font-semibold text-gray-800">First Bank Nigeria</span>
                           <span className="text-gray-500">Account Name</span><span className="font-semibold text-gray-800">PNB Energy Ltd</span>
                           <span className="text-gray-500">Account Number</span><span className="font-bold text-gray-900 font-mono">3012345678</span>
                         </div>
                         <p className="text-xs text-blue-600 mt-1">Use your name as payment reference. Send proof to trucks@pipesandbarrels.com</p>
                       </div>
                     )}

                     {/* Paystack Integration */}
                     {rentBook.paymentMethod === "paystack" && (
                       <div className="bg-teal-50 border-2 border-teal-400 rounded-xl p-6 flex flex-col items-center text-center gap-4">
                         <div className="w-14 h-14 rounded-full bg-teal-500 flex items-center justify-center">
                           <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="w-7 h-7">
                             <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                             <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                           </svg>
                         </div>
                         <div>
                           <p className="font-bold text-teal-800 text-lg">Pay via Paystack</p>
                           <p className="text-teal-700 text-sm mt-1 leading-relaxed">
                             You will be redirected to Paystack's secure checkout to complete your truck rental payment.
                           </p>
                         </div>
                         <div className="flex items-center gap-2 text-teal-600 text-xs font-medium">
                           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                             <rect x="3" y="11" width="18" height="11" rx="2" />
                             <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
                           </svg>
                           256-bit SSL encrypted · PCI DSS compliant
                         </div>
                       </div>
                     )}

                     {/* OPay Details */}
                     {rentBook.paymentMethod === "opay" && (
                       <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                         <p className="text-xs font-bold text-green-700 uppercase tracking-wider">OPay Details</p>
                         <div className="grid grid-cols-2 gap-y-1 text-sm">
                           <span className="text-gray-500">OPay Number</span><span className="font-bold text-gray-900 font-mono">08087550875</span>
                           <span className="text-gray-500">Account Name</span><span className="font-semibold text-gray-800">PNB Energy Ltd</span>
                         </div>
                         <p className="text-xs text-green-600 mt-1">Send payment via OPay app then contact us with your receipt.</p>
                       </div>
                     )}

                     {/* Card Note */}
                     {rentBook.paymentMethod === "card" && (
                       <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                         <p className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-1">Card Payment</p>
                         <p className="text-sm text-gray-700">You will be redirected to our secure payment gateway to complete your card payment after confirming this booking.</p>
                       </div>
                     )}
                  </div>

                  {bookingError && <p className="text-sm text-red-500 text-center">{bookingError}</p>}
                  <div className="flex gap-3">
                    <button onClick={() => setRentStep(3)} className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition">← Back</button>
                    <button
                      onClick={handleConfirmBooking}
                      className="flex-1 py-4 bg-green-600 text-white font-bold text-base rounded-lg hover:bg-green-700 transition shadow-lg"
                    >
                      Confirm Booking ✓
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}


          {/* ─── REGISTER TAB ─── */}
          {(activeTab === "register" || showOwnerRegister) && (
            <form onSubmit={handleSubmitRegistration} className="space-y-6">
              
              {/* Owner Information */}
              <div className="bg-white rounded-lg shadow-lg border-2 border-orange-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">1</span>
                  Owner Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Full Name">
                    <input
                      className={inputClass}
                      placeholder="Enter owner's full name"
                      value={registration.ownerName}
                      onChange={(e) => updateRegistration("ownerName", e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Phone Number">
                    <input
                      className={inputClass}
                      placeholder="+234 xxx xxx xxxx"
                      value={registration.ownerPhone}
                      onChange={(e) => updateRegistration("ownerPhone", e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Email Address">
                    <input
                      className={inputClass}
                      type="email"
                      placeholder="owner@example.com"
                      value={registration.ownerEmail}
                      onChange={(e) => updateRegistration("ownerEmail", e.target.value)}
                      required
                    />
                  </Field>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="bg-white rounded-lg shadow-lg border-2 border-orange-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">2</span>
                  Vehicle Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Vehicle Type">
                    <select
                      className={selectClass}
                      value={registration.vehicleType}
                      onChange={(e) => updateRegistration("vehicleType", e.target.value)}
                      required
                    >
                      <option value="">Select type</option>
                      <option value="Articulated Tanker">Articulated Tanker</option>
                      <option value="Rigid Tanker">Rigid Tanker</option>
                      <option value="Mini Tanker">Mini Tanker</option>
                    </select>
                  </Field>
                  <Field label="Tank Capacity (Litres)">
                    <select
                      className={selectClass}
                      value={registration.tankCapacity}
                      onChange={(e) => updateRegistration("tankCapacity", e.target.value)}
                      required
                    >
                      <option value="">Select capacity</option>
                      <option value="33000">33,000 Litres</option>
                      <option value="45000">45,000 Litres</option>
                      <option value="60000">60,000 Litres</option>
                      <option value="100000">100,000 Litres</option>
                    </select>
                  </Field>
                  <Field label="Number of Compartments">
                    <input
                      className={inputClass}
                      type="number"
                      min="1"
                      max="6"
                      placeholder="e.g. 3"
                      value={registration.compartments}
                      onChange={(e) => updateRegistration("compartments", e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Truck Registration Number">
                    <input
                      className={inputClass}
                      placeholder="e.g. ABC-123-XY"
                      value={registration.truckRegNumber}
                      onChange={(e) => updateRegistration("truckRegNumber", e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Tractor Color">
                    <input
                      className={inputClass}
                      placeholder="e.g. Blue"
                      value={registration.tractorColor}
                      onChange={(e) => updateRegistration("tractorColor", e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Tank Color">
                    <input
                      className={inputClass}
                      placeholder="e.g. Silver"
                      value={registration.tankColor}
                      onChange={(e) => updateRegistration("tankColor", e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Chassis Number">
                    <input
                      className={inputClass}
                      placeholder="Enter chassis number"
                      value={registration.chassisNumber}
                      onChange={(e) => updateRegistration("chassisNumber", e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Engine Number">
                    <input
                      className={inputClass}
                      placeholder="Enter engine number"
                      value={registration.engineNumber}
                      onChange={(e) => updateRegistration("engineNumber", e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Year of Manufacture">
                    <input
                      className={inputClass}
                      type="number"
                      min="1990"
                      max={new Date().getFullYear()}
                      placeholder="e.g. 2020"
                      value={registration.yearOfManufacture}
                      onChange={(e) => updateRegistration("yearOfManufacture", e.target.value)}
                      required
                    />
                  </Field>
                </div>
              </div>

              {/* Certifications & Insurance */}
              <div className="bg-white rounded-lg shadow-lg border-2 border-orange-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">3</span>
                  Certifications & Insurance
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Insurance Provider">
                    <input
                      className={inputClass}
                      placeholder="e.g. AIICO Insurance"
                      value={registration.insuranceProvider}
                      onChange={(e) => updateRegistration("insuranceProvider", e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Insurance Policy Number">
                    <input
                      className={inputClass}
                      placeholder="Enter policy number"
                      value={registration.insurancePolicyNumber}
                      onChange={(e) => updateRegistration("insurancePolicyNumber", e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Insurance Expiry Date">
                    <input
                      className={inputClass}
                      type="date"
                      value={registration.insuranceExpiry}
                      onChange={(e) => updateRegistration("insuranceExpiry", e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="DPR Certificate Number">
                    <input
                      className={inputClass}
                      placeholder="Enter DPR cert number"
                      value={registration.dprCertNumber}
                      onChange={(e) => updateRegistration("dprCertNumber", e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="DPR Certificate Expiry">
                    <input
                      className={inputClass}
                      type="date"
                      value={registration.dprCertExpiry}
                      onChange={(e) => updateRegistration("dprCertExpiry", e.target.value)}
                      required
                    />
                  </Field>
                  <Field label="Road Worthiness Expiry">
                    <input
                      className={inputClass}
                      type="date"
                      value={registration.roadWorthinessExpiry}
                      onChange={(e) => updateRegistration("roadWorthinessExpiry", e.target.value)}
                      required
                    />
                  </Field>
                </div>
              </div>

              {/* Product Types & Route */}
              <div className="bg-white rounded-lg shadow-lg border-2 border-orange-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">4</span>
                  Product Types & Route
                </h2>
                
                <Field label="Product Types (Select all that apply)" className="mb-4">
                  <div className="flex flex-wrap gap-3 mt-2">
                    {["PMS (Petrol)", "AGO (Diesel)", "ATK (Jet Fuel)", "LPG (Gas)"].map((type) => (
                      <label
                        key={type}
                        className={`px-4 py-2 border-2 rounded-lg cursor-pointer transition-all ${
                          registration.productTypes.includes(type)
                            ? "border-orange-500 bg-orange-50 text-orange-700 font-semibold"
                            : "border-gray-300 hover:border-orange-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="mr-2"
                          checked={registration.productTypes.includes(type)}
                          onChange={() => toggleProductType(type)}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </Field>

                <div className="mt-4">
                  <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2">Routes & Rates</p>
                  <p className="text-xs text-gray-400 mb-3">Select the zones you operate in and set your trip rate for each. Rates are reviewed and may be adjusted by admin before approval.</p>
                  <div className="flex flex-col gap-3">
                    {GEO_ZONES.map(({ name: zone, states }) => {
                      const checked = zone in registration.zoneRates;
                      const toggle = () => {
                        const next = { ...registration.zoneRates };
                        if (checked) delete next[zone];
                        else next[zone] = 0;
                        updateRegistration("zoneRates", next);
                      };
                      return (
                        <div key={zone}
                          className={`border-2 rounded-lg transition-all ${checked ? "border-orange-500 bg-orange-50" : "border-gray-300"}`}>
                          <label className="flex items-start gap-3 px-4 py-3 cursor-pointer">
                            <input type="checkbox" className="mt-0.5 accent-orange-500" checked={checked} onChange={toggle} />
                            <div className="flex-1">
                              <p className={`text-sm font-semibold ${checked ? "text-orange-700" : "text-gray-800"}`}>{zone}</p>
                              <p className="text-xs text-gray-500">{states.join(", ")}</p>
                            </div>
                          </label>
                          {checked && (
                            <div className="px-4 pb-3 flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Your rate (₦/trip):</span>
                              <input
                                type="number"
                                min={0}
                                placeholder="e.g. 95000"
                                value={registration.zoneRates[zone] || ""}
                                onChange={e => updateRegistration("zoneRates", { ...registration.zoneRates, [zone]: Number(e.target.value) })}
                                className="flex-1 border border-orange-300 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-orange-500 bg-white"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Document Upload */}
              <div className="bg-white rounded-lg shadow-lg border-2 border-orange-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">5</span>
                  Required Documents
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Vehicle License">
                    <input
                      className={inputClass}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => updateRegistration("documents", {
                        ...registration.documents,
                        vehicleLicense: e.target.files?.[0] || null,
                      })}
                      required
                    />
                  </Field>
                  <Field label="Insurance Certificate">
                    <input
                      className={inputClass}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => updateRegistration("documents", {
                        ...registration.documents,
                        insurance: e.target.files?.[0] || null,
                      })}
                      required
                    />
                  </Field>
                  <Field label="DPR Certificate">
                    <input
                      className={inputClass}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => updateRegistration("documents", {
                        ...registration.documents,
                        dprCert: e.target.files?.[0] || null,
                      })}
                      required
                    />
                  </Field>
                  <Field label="Road Worthiness Certificate">
                    <input
                      className={inputClass}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => updateRegistration("documents", {
                        ...registration.documents,
                        roadWorthiness: e.target.files?.[0] || null,
                      })}
                      required
                    />
                  </Field>
                </div>
              </div>

              {/* Truck Photos */}
              <div className="bg-white rounded-lg shadow-lg border-2 border-orange-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">6</span>
                  Truck Photos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tractor / Head Unit Photo */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                      Tractor / Head Unit Photo
                    </label>
                    <div
                      className="relative border-2 border-dashed border-orange-300 rounded-lg overflow-hidden cursor-pointer hover:border-orange-500 transition-colors bg-orange-50"
                      style={{ minHeight: "180px" }}
                      onClick={() => tractorInputRef.current?.click()}
                    >
                      {tractorPreview ? (
                        <>
                          <img
                            src={tractorPreview}
                            alt="Tractor preview"
                            className="w-full h-full object-cover absolute inset-0"
                            style={{ minHeight: "180px" }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImageChange("tractorImage", setTractorPreview, null);
                              if (tractorInputRef.current) tractorInputRef.current.value = "";
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow hover:bg-red-600 z-10"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-gray-400 py-10 px-4 text-center">
                          <svg className="w-10 h-10 text-orange-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                          <p className="text-sm font-medium text-gray-500">Click to upload tractor photo</p>
                          <p className="text-xs text-gray-400">JPG, PNG up to 10MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={tractorInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleImageChange("tractorImage", setTractorPreview, e.target.files?.[0] || null)
                      }
                    />
                  </div>

                  {/* Tank Photo */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                      Tank / Body Photo
                    </label>
                    <div
                      className="relative border-2 border-dashed border-orange-300 rounded-lg overflow-hidden cursor-pointer hover:border-orange-500 transition-colors bg-orange-50"
                      style={{ minHeight: "180px" }}
                      onClick={() => tankInputRef.current?.click()}
                    >
                      {tankPreview ? (
                        <>
                          <img
                            src={tankPreview}
                            alt="Tank preview"
                            className="w-full h-full object-cover absolute inset-0"
                            style={{ minHeight: "180px" }}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleImageChange("tankImage", setTankPreview, null);
                              if (tankInputRef.current) tankInputRef.current.value = "";
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow hover:bg-red-600 z-10"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2 text-gray-400 py-10 px-4 text-center">
                          <svg className="w-10 h-10 text-orange-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                          </svg>
                          <p className="text-sm font-medium text-gray-500">Click to upload tank photo</p>
                          <p className="text-xs text-gray-400">JPG, PNG up to 10MB</p>
                        </div>
                      )}
                    </div>
                    <input
                      ref={tankInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleImageChange("tankImage", setTankPreview, e.target.files?.[0] || null)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Driver & Motor Boy Details */}
              <div className="bg-white rounded-lg shadow-lg border-2 border-orange-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">7</span>
                  Driver & Motor Boy Details
                </h2>
                
                {/* Driver Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Driver Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Driver Name">
                      <input
                        className={inputClass}
                        placeholder="Enter driver's full name"
                        value={registration.driverName}
                        onChange={(e) => updateRegistration("driverName", e.target.value)}
                        required
                      />
                    </Field>
                    <Field label="Driver Phone Number">
                      <input
                        className={inputClass}
                        placeholder="+234 xxx xxx xxxx"
                        value={registration.driverPhone}
                        onChange={(e) => updateRegistration("driverPhone", e.target.value)}
                        required
                      />
                    </Field>
                    <Field label="Driver License Number">
                      <input
                        className={inputClass}
                        placeholder="Enter license number"
                        value={registration.driverLicenseNumber}
                        onChange={(e) => updateRegistration("driverLicenseNumber", e.target.value)}
                        required
                      />
                    </Field>
                    <Field label="Driver License Expiry">
                      <input
                        className={inputClass}
                        type="date"
                        value={registration.driverLicenseExpiry}
                        onChange={(e) => updateRegistration("driverLicenseExpiry", e.target.value)}
                        required
                      />
                    </Field>
                  </div>
                </div>

                {/* Motor Boy Section */}
                <div>
                  <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Motor Boy Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Motor Boy Name">
                      <input
                        className={inputClass}
                        placeholder="Enter motor boy's full name"
                        value={registration.motorBoyName}
                        onChange={(e) => updateRegistration("motorBoyName", e.target.value)}
                        required
                      />
                    </Field>
                    <Field label="Motor Boy Phone Number">
                      <input
                        className={inputClass}
                        placeholder="+234 xxx xxx xxxx"
                        value={registration.motorBoyPhone}
                        onChange={(e) => updateRegistration("motorBoyPhone", e.target.value)}
                        required
                      />
                    </Field>
                    <Field label="Motor Boy ID Type">
                      <select
                        className={selectClass}
                        value={registration.motorBoyIdType}
                        onChange={(e) => updateRegistration("motorBoyIdType", e.target.value)}
                        required
                      >
                        <option value="">Select ID type</option>
                        <option value="NIN">NIN</option>
                        <option value="Voter's Card">Voter's Card</option>
                        <option value="International Passport">International Passport</option>
                        <option value="Driver's License">Driver's License</option>
                      </select>
                    </Field>
                    <Field label="Motor Boy ID Number">
                      <input
                        className={inputClass}
                        placeholder="Enter ID number"
                        value={registration.motorBoyIdNumber}
                        onChange={(e) => updateRegistration("motorBoyIdNumber", e.target.value)}
                        required
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Destination Section */}
              <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Route / Destination</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Destination State">
                    <Select
                      options={NG_STATES}
                      value={registration.destinationState ? { value: registration.destinationState, label: registration.destinationState } : null}
                      onChange={(opt) => { updateRegistration("destinationState", opt?.value ?? ""); updateRegistration("destinationTown", ""); }}
                      placeholder="Select state..."
                      isClearable
                      classNamePrefix="rs"
                      styles={{ control: (base) => ({ ...base, borderColor: "#d1d5db", borderRadius: "4px", fontSize: "14px", minHeight: "38px" }), menu: (base) => ({ ...base, zIndex: 50 }) }}
                    />
                  </Field>
                  <Field label="Destination Town / LGA">
                    <Select
                      options={getLgaOptions(registration.destinationState)}
                      value={registration.destinationTown ? { value: registration.destinationTown, label: registration.destinationTown } : null}
                      onChange={(opt) => updateRegistration("destinationTown", opt?.value ?? "")}
                      placeholder={registration.destinationState ? "Select LGA..." : "Select state first"}
                      isDisabled={!registration.destinationState}
                      isClearable
                      classNamePrefix="rs"
                      styles={{ control: (base) => ({ ...base, borderColor: "#d1d5db", borderRadius: "4px", fontSize: "14px", minHeight: "38px" }), menu: (base) => ({ ...base, zIndex: 50 }) }}
                    />
                  </Field>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-4 bg-orange-500 text-white font-bold text-lg rounded-lg hover:bg-orange-600 transition-all active:scale-95 shadow-lg"
              >
                Submit Registration for Review →
              </button>

              <p className="text-center text-sm text-gray-500">
                By submitting, you agree to our terms of service and certify that all information provided is accurate.
              </p>
            </form>
          )}
            </>
          )}
          </div>
        </div>
      </main>

      {/* ── Truck Edit Modal ── */}
      {selectedOwnerTruck && editForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editForm.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Edit details — saved changes update your listing</p>
              </div>
              <button
                onClick={() => { setSelectedOwnerTruck(null); setEditForm(null); }}
                className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto px-8 py-6 space-y-6 flex-1">
              <Section title="Vehicle Details">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <EditField label="Truck Name" value={editForm.name} onChange={(v) => setEditForm((f) => f && ({ ...f, name: v }))} />
                  <EditField label="Vehicle Type" value={editForm.vehicleType} onChange={(v) => setEditForm((f) => f && ({ ...f, vehicleType: v }))} />
                  <EditField label="Capacity (L)" value={editForm.capacity} onChange={(v) => setEditForm((f) => f && ({ ...f, capacity: v }))} />
                  <EditField label="Reg Number" value={editForm.regNumber} onChange={(v) => setEditForm((f) => f && ({ ...f, regNumber: v }))} />
                  <EditField label="Tractor Color" value={editForm.tractorColor} onChange={(v) => setEditForm((f) => f && ({ ...f, tractorColor: v }))} />
                  <EditField label="Tank Color" value={editForm.tankColor} onChange={(v) => setEditForm((f) => f && ({ ...f, tankColor: v }))} />
                  <EditField label="Chassis Number" value={editForm.chassisNumber} onChange={(v) => setEditForm((f) => f && ({ ...f, chassisNumber: v }))} />
                  <EditField label="Engine Number" value={editForm.engineNumber} onChange={(v) => setEditForm((f) => f && ({ ...f, engineNumber: v }))} />
                  <EditField label="Year of Manufacture" value={editForm.yearOfManufacture} onChange={(v) => setEditForm((f) => f && ({ ...f, yearOfManufacture: v }))} />
                </div>
              </Section>

              <Section title="Pricing">
                <div className="max-w-xs">
                  <EditField label="Daily Rate (₦)" value={String(editForm.dailyRate)} type="number" onChange={(v) => setEditForm((f) => f && ({ ...f, dailyRate: Number(v) || 0 }))} />
                </div>
              </Section>

              <Section title="Insurance & Certifications">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <EditField label="Insurance Provider" value={editForm.insuranceProvider} onChange={(v) => setEditForm((f) => f && ({ ...f, insuranceProvider: v }))} />
                  <EditField label="Policy Number" value={editForm.insurancePolicyNumber} onChange={(v) => setEditForm((f) => f && ({ ...f, insurancePolicyNumber: v }))} />
                  <EditField label="Insurance Expiry" value={editForm.insuranceExpiry} type="date" onChange={(v) => setEditForm((f) => f && ({ ...f, insuranceExpiry: v }))} />
                  <EditField label="DPR Cert Number" value={editForm.dprCertNumber} onChange={(v) => setEditForm((f) => f && ({ ...f, dprCertNumber: v }))} />
                  <EditField label="DPR Cert Expiry" value={editForm.dprCertExpiry} type="date" onChange={(v) => setEditForm((f) => f && ({ ...f, dprCertExpiry: v }))} />
                  <EditField label="Road Worthiness Expiry" value={editForm.roadWorthinessExpiry} type="date" onChange={(v) => setEditForm((f) => f && ({ ...f, roadWorthinessExpiry: v }))} />
                </div>
              </Section>

              <Section title="Driver Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <EditField label="Driver Name" value={editForm.driverName} onChange={(v) => setEditForm((f) => f && ({ ...f, driverName: v }))} />
                  <EditField label="Driver Phone" value={editForm.driverPhone} onChange={(v) => setEditForm((f) => f && ({ ...f, driverPhone: v }))} />
                  <EditField label="License Number" value={editForm.driverLicenseNumber} onChange={(v) => setEditForm((f) => f && ({ ...f, driverLicenseNumber: v }))} />
                  <EditField label="License Expiry" value={editForm.driverLicenseExpiry} type="date" onChange={(v) => setEditForm((f) => f && ({ ...f, driverLicenseExpiry: v }))} />
                </div>
              </Section>

              <Section title="Motor Boy Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <EditField label="Motor Boy Name" value={editForm.motorBoyName} onChange={(v) => setEditForm((f) => f && ({ ...f, motorBoyName: v }))} />
                  <EditField label="Motor Boy Phone" value={editForm.motorBoyPhone} onChange={(v) => setEditForm((f) => f && ({ ...f, motorBoyPhone: v }))} />
                </div>
              </Section>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-8 py-4 border-t border-gray-100">
              <button
                onClick={() => { setSelectedOwnerTruck(null); setEditForm(null); }}
                className="flex-1 py-2.5 border-2 border-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTruck}
                className="flex-1 py-2.5 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition text-sm shadow-lg shadow-orange-500/20"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <FlowCompleteModal
        isOpen={showFlowModal}
        onClose={() => setShowFlowModal(false)}
        title="Truck Booked!"
        subtitle="Your rental booking is confirmed. Our team will be in touch shortly."
        orderId={lastBookingRef}
        orderLabel="Booking Ref"
        completedSteps={[
          { label: "Truck", detail: "Selected" },
          { label: "Destination", detail: "Set" },
          { label: "Schedule", detail: "Confirmed" },
          { label: "Payment", detail: "Done" },
        ]}
        nextActions={[
          {
            label: "Buy Fuel",
            description: "Place a purchase order",
            href: "/buynow",
            color: "orange",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>,
          },
          {
            label: "Load Fuel",
            description: "Proceed to loading bay",
            href: "/load",
            color: "green",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H7m0 0l4-4m-4 4l4 4"/></svg>,
          },
          {
            label: "Pay Dues",
            description: "Settle outstanding levies",
            href: "/paydues",
            color: "blue",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
          },
          {
            label: "Book Delivery",
            description: "Schedule a delivery",
            href: "/booknow",
            color: "purple",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
          },
          {
            label: "Go Home",
            description: "Return to dashboard",
            href: "/home",
            color: "gray",
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>,
          },
        ]}
      />

    </div>
  );
}
