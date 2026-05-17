import { useRouter } from "next/router";
import Head from "next/head";
import { useState, useEffect } from "react";
import Input from "../../components/Input";
import BookingLayout from "@/components/BookingLayout";
import Dropdown from "@/components/Dropdown";

const STORAGE_KEY = "booking_product_info";

export default function productbooking() {
  const router = useRouter();
  const [contactInfo, setContactInfo] = useState({ email: "info@e-nergy.com.ng", phone: "(+234) 08087550875" });
  const [form, setForm] = useState({
    productType: "",
    productQuantity: "",
    haulageTruck: "",
    driverName: "",
    driverIdType: "",
    driverIdNumber: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState("");

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

  const handleSubmit = async () => {
    if (!form.productType) { setError("Please select a product type."); return; }
    if (!form.productQuantity) { setError("Please select a product quantity."); return; }
    if (!form.haulageTruck) { setError("Please select a haulage truck option."); return; }
    if (!form.driverName.trim()) { setError("Driver's name is required."); return; }
    if (!form.driverIdType) { setError("Please select a driver ID type."); return; }
    if (!form.driverIdNumber.trim()) { setError("Driver ID number is required."); return; }

    const companyRaw = localStorage.getItem("booking_company_info");
    const ownerRaw = localStorage.getItem("booking_owner_info");
    if (!companyRaw || !ownerRaw) {
      setError("Company and owner information is missing. Please go back and fill in all steps.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const company = JSON.parse(companyRaw);
      const owner = JSON.parse(ownerRaw);
      const generatedId = `ENR-${Date.now()}`;
      const { api } = await import("@/lib/db-client");
      const qtyNum = parseInt(form.productQuantity.replace(/[^0-9]/g, ""), 10) || 0;
      await api.purchaseOrders.create({
        orderId: generatedId,
        companyName: company.companyName,
        dprRegNo: company.marketersLicense,
        cacRegNo: company.cacRegNumber,
        companyAddress: company.headOfficeAddress,
        companyTelephone: company.telephone,
        companyEmail: company.email,
        stationAddress: company.stationAddress,
        ownerName: owner.ownerName,
        ownerTelephone: owner.telephone,
        ownerAddress: owner.address,
        ownerEmail: owner.email,
        ownerIdType: owner.idType,
        ownerIdNumber: owner.idNumber,
        productType: form.productType,
        productQuantity: qtyNum,
        haulageTruck: (form.haulageTruck === "Rent Truck" ? "rent_truck" : "owned_truck") as "owned_truck" | "rent_truck",
        paymentMethod: "bank_transfer",
      });
      localStorage.removeItem("booking_company_info");
      localStorage.removeItem("booking_owner_info");
      localStorage.removeItem(STORAGE_KEY);
      setOrderId(generatedId);
      setSubmitted(true);
    } catch {
      setError("Submission failed. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Head><title>Booking Confirmed | e-Nergy</title></Head>
        <BookingLayout>
          <div className="min-h-full w-full flex flex-col items-center justify-center p-8 bg-white text-center space-y-4">
            <div className="text-6xl">📋</div>
            <h2 className="text-2xl font-bold text-gray-800">Booking Submitted!</h2>
            <p className="text-gray-500 text-sm max-w-sm">
              Your booking has been received. Our team will contact you within 24 hours to confirm your delivery slot.
            </p>
            {orderId && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-50 border border-orange-200">
                <span className="text-orange-500">🔖</span>
                <span className="text-sm font-semibold text-orange-700">Order ID: {orderId}</span>
              </div>
            )}
            <button
              onClick={() => router.push("/")}
              className="mt-4 px-6 py-2 bg-orange-500 text-white text-sm font-semibold rounded hover:bg-orange-600 transition"
            >
              Back to Home
            </button>
          </div>
        </BookingLayout>
      </>
    );
  }

  return (
    <>
      <Head><title>Product Booking | e-Nergy</title></Head>
    <BookingLayout>
      <div className="min-h-full w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 bg-white">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
          {/* LEFT SIDE - HEADING */}
          <div className="flex flex-col justify-center order-1 lg:order-1 col-span-1 lg:col-span-1">
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

          {/* MIDDLE - FORM */}
          <div className="space-y-3 md:space-y-5 order-2 lg:order-2 col-span-1 lg:col-span-1">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold">
              Product Booking
            </h2>
            <p className="text-sm md:text-base text-gray-700">
              Carefully fill in the product and driver details.
            </p>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

            <Dropdown
              label="PRODUCT TYPE"
              options={["PMS", "AGO", "DPK"]}
              placeholder="Select type"
              value={form.productType}
              onChange={(v) => setForm((f) => ({ ...f, productType: v }))}
            />
            <Dropdown
              label="PRODUCT QUANTITY"
              options={["33,000 liters", "45,000 liters", "60,000 liters", "100,000 liters"]}
              placeholder="select or manually enter a quantity"
              value={form.productQuantity}
              onChange={(v) => setForm((f) => ({ ...f, productQuantity: v }))}
            />

            <Dropdown
              label="HAULAGE TRUCK"
              options={["Owned Truck", "Rent Truck"]}
              placeholder="Select type"
              value={form.haulageTruck}
              onChange={(v) => setForm((f) => ({ ...f, haulageTruck: v }))}
            />

            <Input label="DRIVER'S NAME" placeholder="enter driver's name" value={form.driverName} onChange={update("driverName")} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              <Dropdown
                label="DRIVER'S ID"
                options={["International passport", "Driver's license", "National ID"]}
                placeholder="Select type"
                value={form.driverIdType}
                onChange={(v) => setForm((f) => ({ ...f, driverIdType: v }))}
              />
              <Input label="ID NUMBER" placeholder="enter selected ID number" value={form.driverIdNumber} onChange={update("driverIdNumber")} />
            </div>

            <div className="flex justify-between pt-6">
              <button
                onClick={() => router.push("/bookings/ownerinfo")}
                className="text-blue-600 font-semibold hover:text-blue-800 transition"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="text-blue-600 font-semibold hover:text-blue-800 transition disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit Booking →"}
              </button>
            </div>
          </div>

          {/* RIGHT SIDE - TRUCK SELECTION */}
          <div className="order-3 lg:order-3 col-span-1 lg:col-span-1">
            <div className="flex justify-center items-center bg-gray-100 w-full h-60 sm:h-72 md:h-80 rounded-lg">
              <p className="text-sm sm:text-base md:text-lg text-gray-500 font-medium">
                No Truck selected
              </p>
            </div>
          </div>
        </div>
      </div>
    </BookingLayout>
    </>
  );
}
