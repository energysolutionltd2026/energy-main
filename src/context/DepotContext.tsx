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
  "Lagos Main Depot",
  "Port Harcourt Terminal",
  "Warri Storage Facility",
  "Kaduna Distribution Center",
  "Calabar Depot",
  "Ibadan Storage Terminal",
  "Kano Distribution Hub",
  "Enugu Fuel Depot",
  "Abuja Central Terminal",
  "Benin Storage Depot",
];

export const DepotProvider: React.FC<DepotProviderProps> = ({ children }) => {
  const depots = DEPOTS;

  const [depotProducts, setDepotProducts] = useState<Record<string, DepotData>>({
    "Lagos Main Depot": {
      PMS: { level: 72, quantity: "100,000 L/220,000 L", price: "₦897/L", status: "Available" },
      ATK: { level: 48, quantity: "60,000 L/120,000 L", price: "₦1,095/L", status: "Limited" },
      AGO: { level: 85, quantity: "150,000 L/260,000 L", price: "₦1,200/L", status: "Available" },
    },
    "Port Harcourt Terminal": {
      PMS: { level: 60, quantity: "85,000 L/165,000 L", price: "₦892/L", status: "Available" },
      ATK: { level: 25, quantity: "32,000 L/63,000 L", price: "₦1,088/L", status: "Limited" },
      AGO: { level: 90, quantity: "180,000 L/320,000 L", price: "₦1,198/L", status: "Available" },
    },
    "Warri Storage Facility": {
      PMS: { level: 40, quantity: "45,000 L/105,000 L", price: "₦900/L", status: "Limited" },
      ATK: { level: 0, quantity: "0 L/0 L", price: "—", status: "Unavailable" },
      AGO: { level: 70, quantity: "110,000 L/190,000 L", price: "₦1,195/L", status: "Available" },
    },
    "Kaduna Distribution Center": {
      PMS: { level: 55, quantity: "75,000 L/145,000 L", price: "₦898/L", status: "Available" },
      ATK: { level: 35, quantity: "42,000 L/78,000 L", price: "₦1,092/L", status: "Limited" },
      AGO: { level: 78, quantity: "140,000 L/240,000 L", price: "₦1,202/L", status: "Available" },
    },
    "Calabar Depot": {
      PMS: { level: 45, quantity: "62,000 L/118,000 L", price: "₦902/L", status: "Limited" },
      ATK: { level: 20, quantity: "25,000 L/50,000 L", price: "₦1,098/L", status: "Limited" },
      AGO: { level: 82, quantity: "155,000 L/270,000 L", price: "₦1,205/L", status: "Available" },
    },
    "Ibadan Storage Terminal": {
      PMS: { level: 68, quantity: "100,000 L/190,000 L", price: "₦894/L", status: "Available" },
      ATK: { level: 42, quantity: "53,000 L/107,000 L", price: "₦1,090/L", status: "Available" },
      AGO: { level: 88, quantity: "165,000 L/290,000 L", price: "₦1,197/L", status: "Available" },
    },
    "Kano Distribution Hub": {
      PMS: { level: 50, quantity: "68,000 L/132,000 L", price: "₦899/L", status: "Available" },
      ATK: { level: 15, quantity: "18,000 L/37,000 L", price: "₦1,100/L", status: "Limited" },
      AGO: { level: 75, quantity: "125,000 L/225,000 L", price: "₦1,200/L", status: "Available" },
    },
    "Enugu Fuel Depot": {
      PMS: { level: 38, quantity: "50,000 L/95,000 L", price: "₦903/L", status: "Limited" },
      ATK: { level: 28, quantity: "32,000 L/66,000 L", price: "₦1,096/L", status: "Limited" },
      AGO: { level: 65, quantity: "105,000 L/190,000 L", price: "₦1,193/L", status: "Available" },
    },
    "Abuja Central Terminal": {
      PMS: { level: 80, quantity: "125,000 L/235,000 L", price: "₦890/L", status: "Available" },
      ATK: { level: 52, quantity: "65,000 L/130,000 L", price: "₦1,085/L", status: "Available" },
      AGO: { level: 92, quantity: "190,000 L/330,000 L", price: "₦1,196/L", status: "Available" },
    },
    "Benin Storage Depot": {
      PMS: { level: 62, quantity: "88,000 L/167,000 L", price: "₦896/L", status: "Available" },
      ATK: { level: 38, quantity: "45,000 L/90,000 L", price: "₦1,091/L", status: "Available" },
      AGO: { level: 72, quantity: "120,000 L/210,000 L", price: "₦1,199/L", status: "Available" },
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