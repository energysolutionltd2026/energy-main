import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="fixed bottom-0 left-0 w-full z-50 border-t border-white/10 bg-black/60 backdrop-blur-md hidden md:block">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left: copyright */}
        <p className="text-white/50 text-xs">
          © {year} e-Nergy Solutions Limited. All rights reserved.
        </p>

        {/* Right: legal links */}
        <div className="flex items-center gap-5 text-xs">
          <Link href="/contact" className="text-white/60 hover:text-orange-400 transition font-medium">Contact</Link>
          <span className="text-white/20">|</span>
          <Link href="/about" className="text-white/60 hover:text-orange-400 transition font-medium">About</Link>
          <span className="text-white/20">|</span>
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
