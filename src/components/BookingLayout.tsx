import BookingNavbar from "./BookingNavbar";
import Footer from "./Footer";
import type { ReactNode } from "react";

export default function BookingLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-screen flex flex-col bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/tower.jpg')" }}
    >
      {/* dark overlay layer (behind nav & content) */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none z-10" />

      {/* nav and content above overlay */}
      <div className="relative z-20">
        <BookingNavbar />
      </div>

      <main className="relative z-20 flex-grow px-6 md:px-40">
        {children}
      </main>

      <div className="relative z-20">
        <Footer />
      </div>
    </div>
  );
}
