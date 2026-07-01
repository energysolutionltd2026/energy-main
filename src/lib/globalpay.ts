/**
 * GlobalPay.ng payment utility
 * Base URL: https://paygw.globalpay.com.ng/globalpay-paymentgateway/api
 * Auth: apiKey header (your public key from dashboard)
 */

const BASE = "https://paygw.globalpay.com.ng/globalpay-paymentgateway/api/paymentgateway";

function headers() {
  return {
    apikey: process.env.GLOBALPAY_API_KEY!,
    language: "en",
    "Content-Type": "application/json",
  };
}

export async function initiatePayment(payload: {
  amount: number;
  merchantTransactionReference: string;
  redirectUrl: string;
  customer: { name: string; email: string; phone?: string };
}) {
  // Split name into firstName / lastName for the API
  const nameParts = (payload.customer.name ?? "").trim().split(/\s+/);
  const firstName = nameParts[0] ?? "Customer";
  const lastName  = nameParts.slice(1).join(" ") || firstName;

  const res = await fetch(`${BASE}/generate-payment-link`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      amount:                       payload.amount,
      merchantTransactionReference: payload.merchantTransactionReference,
      redirectUrl:                  payload.redirectUrl,
      firstName,
      lastName,
      emailAddress: payload.customer.email,
      phoneNumber:  payload.customer.phone ?? "",
      address:      "Nigeria",
      currency:     "NGN",
    }),
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    console.error(
      "[GlobalPay:initiate] non-JSON response",
      res.status,
      text,
    );
    throw new Error(`GlobalPay ${res.status}: ${text}`);
  }

  console.log("[GlobalPay:initiate] status", res.status, "body", data);

  if (!data.isSuccessful) {
    const reason = data.error
      || (data.responseCode ? `responseCode: ${data.responseCode}` : null)
      || (data.successMessage ? data.successMessage : null)
      || JSON.stringify(data);
    throw new Error(`GlobalPay initiation failed: ${reason}`);
  }

  // API returns either data.data or data.Data depending on endpoint
  const responseData = data.data ?? data.Data;

  // Returns: { checkoutUrl, access, transactionReference, ... }
  return responseData as {
    checkoutUrl: string;
    accessCode: string;
    transactionReference: string;
    merchantMode: string;
  };
}

export async function verifyByMerchantRef(merchantTransRef: string) {
  const res = await fetch(
    `${BASE}/query-single-transaction-by-merchant-reference/${merchantTransRef}`,
    { method: "GET", headers: headers() },
  );

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    console.error(
      "[GlobalPay:verifyByMerchantRef] non-JSON response",
      res.status,
      text,
    );
    throw new Error(`GlobalPay ${res.status}: ${text}`);
  }

  if (!data.isSuccessful)
    throw new Error(data.error ?? "GlobalPay verify failed");
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
  const res = await fetch(`${BASE}/query-single-transaction/${transRef}`, {
    method: "GET",
    headers: headers(),
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    console.error(
      "[GlobalPay:verifyByGlobalPayRef] non-JSON response",
      res.status,
      text,
    );
    throw new Error(`GlobalPay ${res.status}: ${text}`);
  }

  if (!data.isSuccessful)
    throw new Error(data.error ?? "GlobalPay verify failed");
  return data.data;
}