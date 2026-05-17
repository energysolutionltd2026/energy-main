import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DEFAULT_DEPOT_LOGOS } from '../lib/defaultDepotLogos';
import { api } from '../lib/db-client';

/* ---------------- TYPES ---------------- */
export type ProductKey = "PMS" | "ATK" | "AGO";

export type ProductData = {
  level: number;
  quantity: string;
  price: string;
  status: "available" | "limited" | "unavailable";
  capacityLitres: number;
  currentLitres: number;
};

export type DepotData = Record<ProductKey, ProductData>;

interface DepotContextType {
  depots: string[];
  loading: boolean;
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

/* ---------------- HELPERS ---------------- */
const DEFAULT_CAPACITY: Record<ProductKey, number> = { PMS: 220000, AGO: 260000, ATK: 120000 };

function resolveProduct(d: any, key: ProductKey): { level: number; capacityLitres: number; currentLitres: number } {
  const capacity = d[key]?.capacityLitres ?? DEFAULT_CAPACITY[key];
  const hasActual = d[key]?.currentLitres != null && d[key]?.capacityLitres != null;
  const current = hasActual ? d[key].currentLitres : Math.round((d[key]?.level ?? 0) / 100 * capacity);
  const level = capacity > 0 ? Math.min(100, Math.round((current / capacity) * 100)) : (d[key]?.level ?? 0);
  return { level, capacityLitres: capacity, currentLitres: current };
}

function fmtQty(currentLitres: number, capacityLitres: number): string {
  return `${currentLitres.toLocaleString()} L/${capacityLitres.toLocaleString()} L`;
}

function fmtPrice(price: number): string {
  return `₦${price.toLocaleString()}/L`;
}

function depotStatus(level: number): "available" | "limited" | "unavailable" {
  if (level === 0) return "unavailable";
  if (level < 20) return "limited";
  return "available";
}

function apiToDepotData(d: any): DepotData {
  const pms = resolveProduct(d, "PMS");
  const ago = resolveProduct(d, "AGO");
  const atk = resolveProduct(d, "ATK");
  return {
    PMS: { level: pms.level, capacityLitres: pms.capacityLitres, currentLitres: pms.currentLitres, price: fmtPrice(d.PMS?.price ?? 1300), quantity: fmtQty(pms.currentLitres, pms.capacityLitres), status: (d.PMS?.status as ProductData["status"]) ?? depotStatus(pms.level) },
    AGO: { level: ago.level, capacityLitres: ago.capacityLitres, currentLitres: ago.currentLitres, price: fmtPrice(d.AGO?.price ?? 1900), quantity: fmtQty(ago.currentLitres, ago.capacityLitres), status: (d.AGO?.status as ProductData["status"]) ?? depotStatus(ago.level) },
    ATK: { level: atk.level, capacityLitres: atk.capacityLitres, currentLitres: atk.currentLitres, price: fmtPrice(d.ATK?.price ?? 1300), quantity: fmtQty(atk.currentLitres, atk.capacityLitres), status: (d.ATK?.status as ProductData["status"]) ?? depotStatus(atk.level) },
  };
}

/* ---------------- CONTEXT ---------------- */
const DepotContext = createContext<DepotContextType | undefined>(undefined);

/* ---------------- PROVIDER ---------------- */
interface DepotProviderProps { children: ReactNode; }

export const DepotProvider: React.FC<DepotProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [depots, setDepots] = useState<string[]>([]);
  const [depotProducts, setDepotProducts] = useState<Record<string, DepotData>>({});
  const [selectedDepot, setSelectedDepot] = useState("");
  const [activeProduct, setActiveProduct] = useState<ProductKey>("PMS");
  const [depotLogos, setDepotLogos] = useState<Record<string, string>>(DEFAULT_DEPOT_LOGOS);

  useEffect(() => {
    api.depots.list({ limit: 50 } as any)
      .then((result) => {
        if (!result?.data?.length) return;
        const names: string[] = [];
        const products: Record<string, DepotData> = {};
        const logos: Record<string, string> = { ...DEFAULT_DEPOT_LOGOS };

        result.data.forEach((d: any) => {
          names.push(d.name);
          products[d.name] = apiToDepotData(d);
          if (d.logo) logos[d.name] = d.logo;
        });

        setDepots(names);
        setDepotProducts(products);
        setDepotLogos(logos);
        setSelectedDepot(names[0] ?? "");
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const setDepotLogo = (depot: string, logo: string) => {
    setDepotLogos(prev => ({ ...prev, [depot]: logo }));
  };

  const updateProductData = (depot: string, product: ProductKey, data: Partial<ProductData>) => {
    setDepotProducts(prev => ({
      ...prev,
      [depot]: { ...prev[depot], [product]: { ...prev[depot]?.[product], ...data } },
    }));
  };

  const getActiveProductData = () => depotProducts[selectedDepot]?.[activeProduct];

  const value: DepotContextType = {
    depots, loading, selectedDepot, activeProduct, depotProducts, depotLogos,
    setSelectedDepot, setActiveProduct, updateProductData, getActiveProductData, setDepotLogo,
  };

  return <DepotContext.Provider value={value}>{children}</DepotContext.Provider>;
};

/* ---------------- HOOK ---------------- */
export const useDepot = () => {
  const context = useContext(DepotContext);
  if (!context) throw new Error('useDepot must be used within a DepotProvider');
  return context;
};
