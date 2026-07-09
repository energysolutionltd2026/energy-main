import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  const link =
    "text-gray-600 hover:text-orange-500 dark:text-white/60 dark:hover:text-orange-400 transition font-medium";
  const sep = "text-gray-300 dark:text-white/20";

  return (
    <footer className="fixed bottom-0 left-0 w-full z-50 border-t border-black/10 bg-white/70 dark:border-white/10 dark:bg-black/60 backdrop-blur-md hidden md:block">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left: copyright */}
        <p className="text-gray-500 dark:text-white/50 text-xs">
          © {year} e-Nergy Solutions Limited. All rights reserved.
        </p>

        {/* Right: legal links */}
        <div className="flex items-center gap-5 text-xs">
          <Link href="/contact" className={link}>Contact</Link>
          <span className={sep}>|</span>
          <Link href="/about" className={link}>About</Link>
          <span className={sep}>|</span>
          <Link href="/terms-and-conditions" className={link}>
            Terms &amp; Conditions
          </Link>
          <span className={sep}>|</span>
          <Link href="/refund-policy" className={link}>
            Refund Policy
          </Link>
          <span className={sep}>|</span>
          <Link href="/privacy-policy" className={link}>
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
