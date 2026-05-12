import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DEFAULT_DEPOT_LOGOS } from '../lib/defaultDepotLogos';

/* ---------------- TYPES ---------------- */
export type ProductKey = "PMS" | "ATK" | "AGO";

export type ProductData = {
  level: number;
  quantity: string; // Format: "sold L/remaining L" e.g. "100,000 L/220,000 L"
  price: string;
  status: "Available" | "Limited" | "Unavailable";
};

export type DepotData = Record<ProductKey, ProductData>;

interface DepotContextType {
  depots: string[];
  selectedDepot: string;
  activeProduct: ProductKey;
  depotProducts: Record<string, DepotData>;
  depotLogos: Record<string, string>;
  setSelectedDepot: (depot: string) => void;
  setActiveProduct: (product: ProductKey) => void;
  updateProductData: (depot: string, product: ProductKey, data: Partial<ProductData>) => void;
  getActiveProductData: () => ProductData | undefined;
  setDepotLogo: (depot: string, logo: string) => void;
}

/* ---------------- CONTEXT ---------------- */
const DepotContext = createContext<DepotContextType | undefined>(undefined);

/* ---------------- PROVIDER ---------------- */
interface DepotProviderProps {
  children: ReactNode;
}

export const DEPOTS = [
  "Atlas Cove",
  "Mosimi",
  "Warri",
  "Port Harcourt",
  "Kaduna",
  "Ilorin",
  "Ore",
  "Enugu",
  "Calabar",
  "Kano",
];

export const DepotProvider: React.FC<DepotProviderProps> = ({ children }) => {
  const depots = DEPOTS;

  const [depotProducts, setDepotProducts] = useState<Record<string, DepotData>>({
    "Atlas Cove": {
      PMS: { level: 75, quantity: "165,000 L/220,000 L", price: "₦1,300/L", status: "Available"   },
      AGO: { level: 60, quantity: "156,000 L/260,000 L", price: "₦1,900/L", status: "Available"   },
      ATK: { level: 45, quantity:  "54,000 L/120,000 L", price: "₦1,300/L", status: "Available"   },
    },
    "Mosimi": {
      PMS: { level: 82, quantity: "180,400 L/220,000 L", price: "₦1,300/L", status: "Available"   },
      AGO: { level: 55, quantity: "143,000 L/260,000 L", price: "₦1,900/L", status: "Available"   },
      ATK: { level: 0,  quantity:        "0 L/120,000 L", price: "₦1,300/L", status: "Unavailable" },
    },
    "Warri": {
      PMS: { level: 90, quantity: "198,000 L/220,000 L", price: "₦1,300/L", status: "Available"   },
      AGO: { level: 80, quantity: "208,000 L/260,000 L", price: "₦1,900/L", status: "Available"   },
      ATK: { level: 30, quantity:  "36,000 L/120,000 L", price: "₦1,300/L", status: "Available"   },
    },
    "Port Harcourt": {
      PMS: { level: 65, quantity: "143,000 L/220,000 L", price: "₦1,300/L", status: "Available"   },
      AGO: { level: 70, quantity: "182,000 L/260,000 L", price: "₦1,900/L", status: "Available"   },
      ATK: { level: 50, quantity:  "60,000 L/120,000 L", price: "₦1,300/L", status: "Available"   },
    },
    "Kaduna": {
      PMS: { level: 40, quantity:  "88,000 L/220,000 L", price: "₦1,300/L", status: "Available"   },
      AGO: { level: 25, quantity:  "65,000 L/260,000 L", price: "₦1,900/L", status: "Limited"     },
      ATK: { level: 0,  quantity:        "0 L/120,000 L", price: "₦1,300/L", status: "Unavailable" },
    },
    "Ilorin": {
      PMS: { level: 55, quantity: "121,000 L/220,000 L", price: "₦1,300/L", status: "Available"   },
      AGO: { level: 48, quantity: "124,800 L/260,000 L", price: "₦1,900/L", status: "Available"   },
      ATK: { level: 0,  quantity:        "0 L/120,000 L", price: "₦1,300/L", status: "Unavailable" },
    },
    "Ore": {
      PMS: { level: 18, quantity:  "39,600 L/220,000 L", price: "₦1,300/L", status: "Limited"     },
      AGO: { level: 35, quantity:  "91,000 L/260,000 L", price: "₦1,900/L", status: "Available"   },
      ATK: { level: 0,  quantity:        "0 L/120,000 L", price: "₦1,300/L", status: "Unavailable" },
    },
    "Enugu": {
      PMS: { level: 70, quantity: "154,000 L/220,000 L", price: "₦1,300/L", status: "Available"   },
      AGO: { level: 60, quantity: "156,000 L/260,000 L", price: "₦1,900/L", status: "Available"   },
      ATK: { level: 15, quantity:  "18,000 L/120,000 L", price: "₦1,300/L", status: "Limited"     },
    },
    "Calabar": {
      PMS: { level: 50, quantity: "110,000 L/220,000 L", price: "₦1,300/L", status: "Available"   },
      AGO: { level: 45, quantity: "117,000 L/260,000 L", price: "₦1,900/L", status: "Available"   },
      ATK: { level: 20, quantity:  "24,000 L/120,000 L", price: "₦1,300/L", status: "Limited"     },
    },
    "Kano": {
      PMS: { level: 60, quantity: "132,000 L/220,000 L", price: "₦1,300/L", status: "Available"   },
      AGO: { level: 55, quantity: "143,000 L/260,000 L", price: "₦1,900/L", status: "Available"   },
      ATK: { level: 0,  quantity:        "0 L/120,000 L", price: "₦1,300/L", status: "Unavailable" },
    },
  });

  const [selectedDepot, setSelectedDepot] = useState(depots[0]);
  const [activeProduct, setActiveProduct] = useState<ProductKey>("PMS");

  const [depotLogos, setDepotLogos] = useState<Record<string, string>>(DEFAULT_DEPOT_LOGOS);

  const setDepotLogo = (depot: string, logo: string) => {
    setDepotLogos(prev => ({ ...prev, [depot]: logo }));
  };

  const updateProductData = (depot: string, product: ProductKey, data: Partial<ProductData>) => {
    setDepotProducts(prev => ({
      ...prev,
      [depot]: {
        ...prev[depot],
        [product]: {
          ...prev[depot][product],
          ...data
        }
      }
    }));
  };

  const getActiveProductData = () => {
    return depotProducts[selectedDepot]?.[activeProduct];
  };

  const value: DepotContextType = {
    depots,
    selectedDepot,
    activeProduct,
    depotProducts,
    depotLogos,
    setSelectedDepot,
    setActiveProduct,
    updateProductData,
    getActiveProductData,
    setDepotLogo,
  };

  return (
    <DepotContext.Provider value={value}>
      {children}
    </DepotContext.Provider>
  );
};

/* ---------------- HOOK ---------------- */
export const useDepot = () => {
  const context = useContext(DepotContext);
  if (!context) {
    throw new Error('useDepot must be used within a DepotProvider');
  }
  return context;
};