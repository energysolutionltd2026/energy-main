const TERMII_API_KEY  = process.env.TERMII_API_KEY;
const TERMII_SENDER   = process.env.TERMII_SENDER_ID ?? "e-Nergy";
const TERMII_BASE_URL = "https://v3.api.termii.com/api/sms/send";

export async function sendSms(to: string, message: string): Promise<void> {
  if (!TERMII_API_KEY) {
    console.warn("[sms] TERMII_API_KEY not set — skipping SMS to", to);
    return;
  }

  // Normalise to international format: 08012345678 → 2348012345678
  const normalised = to.replace(/\s+/g, "").replace(/^\+/, "").replace(/^0/, "234");

  try {
    const res = await fetch(TERMII_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key:  TERMII_API_KEY,
        to:       normalised,
        from:     TERMII_SENDER,
        sms:      message,
        type:     "plain",
        channel:  "generic",
      }),
    });
    const data = await res.json();
    if (data.code !== "ok" && data.message !== "Successfully Sent") {
      console.error("[sms] Termii error:", JSON.stringify(data));
    } else {
      console.log("[sms] Sent OK to", normalised);
    }
  } catch (err) {
    console.error("[sms] Termii threw:", err);
  }
}
