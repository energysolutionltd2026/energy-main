import { useRouter } from "next/router";
import Head from "next/head";
import { useState, useEffect } from "react";
import Input from "../../components/Input";
import BookingLayout from "@/components/BookingLayout";

const STORAGE_KEY = "booking_company_info";

export default function companyinfo() {
  const router = useRouter();
  const [contactInfo, setContactInfo] = useState({ email: "info@pipesandbarrels.com", phone: "(+234) 08087550875" });
  const [form, setForm] = useState({
    companyName: "",
    marketersLicense: "",
    cacRegNumber: "",
    headOfficeAddress: "",
    telephone: "",
    email: "",
    stationAddress: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => api.platformSettings.get()).then((s) => {
      if (!s) return;
      setContactInfo({ email: s.supportEmail || "info@pipesandbarrels.com", phone: s.supportPhone || "(+234) 08087550875" });
    }).catch(() => null);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { setForm(JSON.parse(saved)); } catch {} }
  }, []);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleNext = () => {
    if (!form.companyName.trim()) { setError("Company name is required."); return; }
    if (!form.marketersLicense.trim()) { setError("Marketer's License Number is required."); return; }
    if (!form.cacRegNumber.trim()) { setError("CAC Registration Number is required."); return; }
    if (!form.headOfficeAddress.trim()) { setError("Head Office Address is required."); return; }
    if (!form.telephone.trim()) { setError("Telephone is required."); return; }
    if (!form.email.trim()) { setError("Email is required."); return; }
    if (!form.stationAddress.trim()) { setError("Station Address is required."); return; }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    router.push("/bookings/ownerinfo");
  };

  return (
    <>
      <Head><title>Company Info | e-Nergy</title></Head>
    <BookingLayout>
      <div className="min-h-fit w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-white">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
          {/* LEFT SIDE - HEADING */}
          <div className="flex flex-col justify-center order-1 lg:order-1">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              WELCOME TO <br />
              PIPES & BARRELS <br />
              OIL & GAS <br />
              BOOKING PAGE
            </h1>

            <p className="mt-6 md:mt-10 text-sm sm:text-base text-gray-600">
              Please be informed that booking within 48 hours from the period of
              booking.
            </p>

            <div className="mt-6 md:mt-10 space-y-4 md:space-y-10 text-sm sm:text-base">
              <p>📧 {contactInfo.email}</p>
              <p>📞 {contactInfo.phone}</p>
            </div>
          </div>

          {/* RIGHT SIDE - FORM */}
          <div className="space-y-3 md:space-y-5 order-2 lg:order-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold">Company Information</h2>
            <p className="text-sm md:text-base text-gray-700">
              Carefully enter your company details into the columns provided.
            </p>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <Input label="Name of Company" placeholder="Chipet Oil" value={form.companyName} onChange={update("companyName")} />
              <Input label="Marketer's License Number" placeholder="***********" value={form.marketersLicense} onChange={update("marketersLicense")} />
            </div>

            <Input label="CAC Registration Number" placeholder="RN4893464" value={form.cacRegNumber} onChange={update("cacRegNumber")} />

            <Input label="Head Office Address" placeholder="Marwa Road, Lagos" value={form.headOfficeAddress} onChange={update("headOfficeAddress")} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <Input label="Telephone" placeholder="+234 814 343 2374" value={form.telephone} onChange={update("telephone")} />
              <Input label="Email" placeholder="info@chipetoil.com" value={form.email} onChange={update("email")} />
            </div>

            <Input label="Station Address for Delivery" placeholder="Lagos" value={form.stationAddress} onChange={update("stationAddress")} />

            <button
              onClick={handleNext}
              className="text-blue-600 font-semibold flex justify-end text-sm md:text-base hover:text-blue-800 transition w-full"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </BookingLayout>
    </>
  );
}
