import { useRouter } from "next/router";
import Head from "next/head";
import { useState, useEffect } from "react";
import Input from "../../components/Input";
import BookingLayout from "@/components/BookingLayout";
import Dropdown from "@/components/Dropdown";

const STORAGE_KEY = "booking_owner_info";

export default function ownerinfo() {
  const router = useRouter();
  const [contactInfo, setContactInfo] = useState({ email: "info@e-nergy.com.ng", phone: "(+234) 08087550875" });
  const [form, setForm] = useState({
    ownerName: "",
    telephone: "",
    address: "",
    email: "",
    idType: "",
    idNumber: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    import("@/lib/db-client").then(({ api }) => api.platformSettings.get()).then((s) => {
      if (!s) return;
      setContactInfo({ email: s.supportEmail || "info@e-nergy.com.ng", phone: s.supportPhone || "(+234) 08087550875" });
    }).catch(() => null);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { setForm(JSON.parse(saved)); } catch {} }
  }, []);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleNext = () => {
    if (!form.ownerName.trim()) { setError("Owner name is required."); return; }
    if (!form.telephone.trim()) { setError("Telephone is required."); return; }
    if (!form.address.trim()) { setError("Address is required."); return; }
    if (!form.email.trim()) { setError("Email is required."); return; }
    if (!form.idType) { setError("Please select an ID type."); return; }
    if (!form.idNumber.trim()) { setError("ID Number is required."); return; }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    router.push("/bookings/productbooking");
  };

  return (
    <>
      <Head><title>Owner Info | e-Nergy</title></Head>
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold">
              Owner&apos;s Information
            </h2>
            <p className="text-sm md:text-base text-gray-700">
              Carefully fill in your company owner&apos;s details into the columns provided.
            </p>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <Input label="NAME" placeholder="enter your name" value={form.ownerName} onChange={update("ownerName")} />
              <Input label="TELEPHONE" placeholder="(+234)" value={form.telephone} onChange={update("telephone")} />
            </div>

            <Input label="ADDRESS" placeholder="enter your address" value={form.address} onChange={update("address")} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <Input label="EMAIL" placeholder="enter your email" value={form.email} onChange={update("email")} />
              <Dropdown
                label="DRIVER'S ID"
                options={["International passport", "Driver's license", "National ID"]}
                placeholder="Select type"
                value={form.idType}
                onChange={(v) => setForm((f) => ({ ...f, idType: v }))}
              />
            </div>

            <Input label="ID NUMBER" placeholder="enter selected ID number" value={form.idNumber} onChange={update("idNumber")} />

            <div className="flex justify-between">
              <button onClick={() => router.push("/bookings/companyinfo")} className="text-blue-600 font-semibold hover:text-blue-800 transition text-sm md:text-base">← Back</button>
              <button onClick={handleNext} className="text-blue-600 font-semibold hover:text-blue-800 transition text-sm md:text-base">Next →</button>
            </div>
          </div>
        </div>
      </div>
    </BookingLayout>
    </>
  );
}
