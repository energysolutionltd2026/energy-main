/**
 * GlobalPay.ng payment utility
 * Base URL: https://paygw.globalpay.com.ng/globalpay-paymentgateway/api
 * Auth: apiKey header (your public key from dashboard)
 */

const BASE = "https://paygw.globalpay.com.ng/globalpay-paymentgateway/api";

function headers() {
  return {
    "apiKey": process.env.GLOBALPAY_API_KEY!,
    "language": "en",
    "Content-Type": "application/json",
  };
}

export async function initiatePayment(payload: {
  amount: number;
  merchantTransactionReference: string;
  redirectUrl: string;
  customer: { name: string; email: string; phone?: string };
}) {
  const res = await fetch(`${BASE}/paymentgateway/generate-payment-link`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      amount: payload.amount,
      merchantTransactionReference: payload.merchantTransactionReference,
      redirectUrl: payload.redirectUrl,
      customer: payload.customer,
    }),
  });
  const data = await res.json();
  if (!data.isSuccessful) throw new Error(data.error ?? "GlobalPay initiation failed");
  // Returns: { checkoutUrl, accessCode, transactionReference, ... }
  return data.data as {
    checkoutUrl: string;
    accessCode: string;
    transactionReference: string;
    merchantMode: string;
  };
}

export async function verifyByMerchantRef(merchantTransRef: string) {
  const res = await fetch(
    `${BASE}/paymentgateway/query-single-transaction-by-merchant-reference/${merchantTransRef}`,
    { method: "POST", headers: headers() }
  );
  const data = await res.json();
  if (!data.isSuccessful) throw new Error(data.error ?? "GlobalPay verify failed");
  return data.data as {
    amountFromMerchant: number;
    amountPaid: number;
    merchantTxnref: string;
    transactionStatus: string; // "Successful" | "Failed" | ...
    transactionDate: string;
    transactionSource: string;
  };
}

export async function verifyByGlobalPayRef(transRef: string) {
  const res = await fetch(
    `${BASE}/paymentgateway/query-single-transaction/${transRef}`,
    { method: "POST", headers: headers() }
  );
  const data = await res.json();
  if (!data.isSuccessful) throw new Error(data.error ?? "GlobalPay verify failed");
  return data.data;
}
