import { registerPlugin } from "@capacitor/core";

interface BillingPlugin {
  purchase(options: { productId: string }): Promise<{ success: boolean; token?: string }>;
  restore(options: { productId: string }): Promise<{ owned: boolean }>;
}

const Billing = registerPlugin<BillingPlugin>("Billing");

export const CapacitorBilling = {
  purchase: (productId: string) => Billing.purchase({ productId }),
  restore: (productId: string) => Billing.restore({ productId }),
};
