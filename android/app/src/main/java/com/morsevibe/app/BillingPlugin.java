package com.morsevibe.app;

import android.app.Activity;
import com.android.billingclient.api.*;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.List;
import java.util.ArrayList;

@CapacitorPlugin(name = "Billing")
public class BillingPlugin extends Plugin implements PurchasesUpdatedListener {

    private BillingClient billingClient;
    private PluginCall pendingCall;

    @Override
    public void load() {
        billingClient = BillingClient.newBuilder(getContext())
            .setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .build();
        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult result) {}
            @Override
            public void onBillingServiceDisconnected() {}
        });
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        String productId = call.getString("productId");
        pendingCall = call;

        List<QueryProductDetailsParams.Product> products = new ArrayList<>();
        products.add(QueryProductDetailsParams.Product.newBuilder()
            .setProductId(productId)
            .setProductType(BillingClient.ProductType.INAPP)
            .build());

        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder()
            .setProductList(products)
            .build();

        billingClient.queryProductDetailsAsync(params, (billingResult, queryResult) -> {
            List<ProductDetails> productDetailsList = queryResult.getProductDetailsList();
            if (billingResult.getResponseCode() != BillingClient.BillingResponseCode.OK || productDetailsList == null || productDetailsList.isEmpty()) {
                call.reject("Product not found: " + billingResult.getDebugMessage());
                return;
            }
            ProductDetails productDetails = productDetailsList.get(0);
            List<BillingFlowParams.ProductDetailsParams> productDetailsParamsList = new ArrayList<>();
            productDetailsParamsList.add(BillingFlowParams.ProductDetailsParams.newBuilder()
                .setProductDetails(productDetails)
                .build());

            BillingFlowParams flowParams = BillingFlowParams.newBuilder()
                .setProductDetailsParamsList(productDetailsParamsList)
                .build();

            Activity activity = getActivity();
            billingClient.launchBillingFlow(activity, flowParams);
        });
    }

    @PluginMethod
    public void restore(PluginCall call) {
        billingClient.queryPurchasesAsync(
            QueryPurchasesParams.newBuilder()
                .setProductType(BillingClient.ProductType.INAPP)
                .build(),
            (billingResult, purchases) -> {
                String productId = call.getString("productId");
                boolean owned = false;
                for (Purchase purchase : purchases) {
                    if (purchase.getProducts().contains(productId) &&
                        purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                        owned = true;
                        acknowledgePurchase(purchase);
                        break;
                    }
                }
                JSObject result = new JSObject();
                result.put("owned", owned);
                call.resolve(result);
            }
        );
    }

    @Override
    public void onPurchasesUpdated(BillingResult billingResult, List<Purchase> purchases) {
        if (pendingCall == null) return;
        if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
                    acknowledgePurchase(purchase);
                    JSObject result = new JSObject();
                    result.put("success", true);
                    result.put("token", purchase.getPurchaseToken());
                    pendingCall.resolve(result);
                    pendingCall = null;
                    return;
                }
            }
        } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            pendingCall.reject("USER_CANCELLED");
        } else {
            pendingCall.reject("Purchase failed: " + billingResult.getDebugMessage());
        }
        pendingCall = null;
    }

    private void acknowledgePurchase(Purchase purchase) {
        if (!purchase.isAcknowledged()) {
            AcknowledgePurchaseParams params = AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchase.getPurchaseToken())
                .build();
            billingClient.acknowledgePurchase(params, result -> {});
        }
    }
}