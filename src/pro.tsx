import React, { createContext, useContext, useState, useEffect } from "react";

const REVENUECAT_API_KEY = "goog_CpFrxcxcujCMTnQtgNuPKkPmpNX";
const PRO_ENTITLEMENT = "Morse Vibe Pro";

interface ProContextType {
  isPro: boolean;
  loading: boolean;
  purchase: () => Promise<void>;
  restore: () => Promise<void>;
}

const ProContext = createContext<ProContextType>({
  isPro: false,
  loading: true,
  purchase: async () => {},
  restore: async () => {},
});

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkPro = async () => {
    try {
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      const info = await Purchases.getCustomerInfo();
      const active = info.customerInfo.entitlements.active;
      setIsPro(!!active[PRO_ENTITLEMENT]);
    } catch(e) {
      console.log("RevenueCat error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkPro(); }, []);

  const purchase = async () => {
    try {
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const offerings = await Purchases.getOfferings();
      const lifetime = offerings.current?.availablePackages.find(p => p.packageType === "LIFETIME");
      if (!lifetime) { alert("Product not available"); return; }
      const result = await Purchases.purchasePackage({ aPackage: lifetime });
      const active = result.customerInfo.entitlements.active;
      setIsPro(!!active[PRO_ENTITLEMENT]);
    } catch(e: any) {
      if (!e.userCancelled) alert("Purchase failed: " + e.message);
    }
  };

  const restore = async () => {
    try {
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const info = await Purchases.restorePurchases();
      const active = info.customerInfo.entitlements.active;
      setIsPro(!!active[PRO_ENTITLEMENT]);
      alert(active[PRO_ENTITLEMENT] ? "Pro restored!" : "No Pro purchase found");
    } catch(e: any) {
      alert("Restore failed: " + e.message);
    }
  };

  return (
    <ProContext.Provider value={{ isPro, loading, purchase, restore }}>
      {children}
    </ProContext.Provider>
  );
}

export const usePro = () => useContext(ProContext);
