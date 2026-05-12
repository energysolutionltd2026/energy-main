import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DEFAULT_DEPOT_LOGOS } from '../lib/defaultDepotLogos';

/* ---------------- TYPES ---------------- */
export type ProductKey = "PMS" | "ATK" | "AGO";

export type ProductData = {
  level: number;
  quantity: string;
  price: string;
  status: "Available" | "Limited" | "Unavailable";
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
const MAX_CAPACITY: Record<ProductKey, number> = { PMS: 220000, AGO: 260000, ATK: 120000 };

function fmtQty(level: number, product: ProductKey): string {
  const max = MAX_CAPACITY[product];
  const stored = Math.round((level / 100) * max);
  return `${stored.toLocaleString()} L/${max.toLocaleString()} L`;
}

function fmtPrice(price: number): string {
  return `₦${price.toLocaleString()}/L`;
}

function depotStatus(level: number): "Available" | "Limited" | "Unavailable" {
  if (level === 0) return "Unavailable";
  if (level < 20) return "Limited";
  return "Available";
}

function apiToDepotData(d: any): DepotData {
  return {
    PMS: {
      level:    d.PMS?.level    ?? 0,
      price:    fmtPrice(d.PMS?.price   ?? 1300),
      quantity: fmtQty(d.PMS?.level ?? 0, "PMS"),
      status:   (d.PMS?.status as ProductData["status"]) ?? depotStatus(d.PMS?.level ?? 0),
    },
    AGO: {
      level:    d.AGO?.level    ?? 0,
      price:    fmtPrice(d.AGO?.price   ?? 1900),
      quantity: fmtQty(d.AGO?.level ?? 0, "AGO"),
      status:   (d.AGO?.status as ProductData["status"]) ?? depotStatus(d.AGO?.level ?? 0),
    },
    ATK: {
      level:    d.ATK?.level    ?? 0,
      price:    fmtPrice(d.ATK?.price   ?? 1300),
      quantity: fmtQty(d.ATK?.level ?? 0, "ATK"),
      status:   (d.ATK?.status as ProductData["status"]) ?? depotStatus(d.ATK?.level ?? 0),
    },
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
    import("@/lib/db-client")
      .then(({ api }) => api.depots.list({ limit: 50 } as any))
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
