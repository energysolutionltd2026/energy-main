import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 w-full border-t border-white/10 bg-black/30 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: copyright */}
        <p className="text-white/50 text-xs">
          © {year} e-Nergy Solutions Limited. All rights reserved.
        </p>

        {/* Right: legal links */}
        <div className="flex items-center gap-5 text-xs">
          <Link
            href="/terms-and-conditions"
            className="text-white/60 hover:text-orange-400 transition font-medium"
          >
            Terms &amp; Conditions
          </Link>
          <span className="text-white/20">|</span>
          <Link
            href="/refund-policy"
            className="text-white/60 hover:text-orange-400 transition font-medium"
          >
            Refund Policy
          </Link>
          <span className="text-white/20">|</span>
          <Link
            href="/privacy-policy"
            className="text-white/60 hover:text-orange-400 transition font-medium"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
