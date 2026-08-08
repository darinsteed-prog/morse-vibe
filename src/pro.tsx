import React, { createContext, useContext, useState, useEffect } from "react";
import { CapacitorBilling } from "./billing";

const PRODUCT_ID = "pro_unlock";

interface ProContextType {
  isPro: boolean;
  purchase: () => Promise<void>;
  restore: () => Promise<void>;
}

const ProContext = createContext<ProContextType>({
  isPro: false,
  purchase: async () => {},
  restore: async () => {},
});

export function ProProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    // Check if already purchased
    const stored = localStorage.getItem("morse_vibe_pro");
    if (stored === "true") setIsPro(true);
  }, []);

  const purchase = async () => {
    try {
      const result = await CapacitorBilling.purchase(PRODUCT_ID);
      if (result.success) {
        setIsPro(true);
        localStorage.setItem("morse_vibe_pro", "true");
        alert("Pro unlocked! Thank you!");
      }
    } catch(e: any) {
      alert("Purchase error: " + (e?.message || JSON.stringify(e)));
    }
  };

  const restore = async () => {
    try {
      const result = await CapacitorBilling.restore(PRODUCT_ID);
      if (result.owned) {
        setIsPro(true);
        localStorage.setItem("morse_vibe_pro", "true");
        alert("Pro restored!");
      } else {
        alert("No Pro purchase found.");
      }
    } catch(e: any) {
      alert("Restore error: " + (e?.message || JSON.stringify(e)));
    }
  };

  return (
    <ProContext.Provider value={{ isPro, purchase, restore }}>
      {children}
    </ProContext.Provider>
  );
}

export const usePro = () => useContext(ProContext);
