import React from 'react'
import Link from 'next/link'

function BottomNavbar() {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex flex-wrap justify-center items-center py-3 border-t border-white/10 bg-black/60 backdrop-blur-md gap-x-4 sm:gap-x-6 gap-y-2 text-center px-4">
      <Link
        href="/contact"
        className="text-white/80 hover:text-orange-400 font-semibold text-xs sm:text-sm transition whitespace-nowrap"
      >
        Contact
      </Link>
      <span className="w-px h-3.5 bg-white/20 hidden sm:inline" />
      <Link
        href="/about"
        className="text-white/80 hover:text-orange-400 font-semibold text-xs sm:text-sm transition whitespace-nowrap"
      >
        About Us
      </Link>
      <span className="w-px h-3.5 bg-white/20 hidden sm:inline" />
      <Link
        href="/terms-and-conditions"
        className="text-white/80 hover:text-orange-400 font-semibold text-xs sm:text-sm transition whitespace-nowrap"
      >
        Terms &amp; Conditions
      </Link>
      <span className="w-px h-3.5 bg-white/20 hidden sm:inline" />
      <Link
        href="/refund-policy"
        className="text-white/80 hover:text-orange-400 font-semibold text-xs sm:text-sm transition whitespace-nowrap"
      >
        Refund Policy
      </Link>
      <span className="w-px h-3.5 bg-white/20 hidden sm:inline" />
      <Link
        href="/privacy-policy"
        className="text-white/80 hover:text-orange-400 font-semibold text-xs sm:text-sm transition whitespace-nowrap"
      >
        Privacy Policy
      </Link>
    </nav>
  )
}

export default BottomNavbar
