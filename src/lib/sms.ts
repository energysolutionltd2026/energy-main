const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN  = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM        = process.env.TWILIO_FROM_NUMBER ?? "+2347065351912";

export async function sendSms(to: string, message: string): Promise<void> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.warn("[sms] Twilio credentials not set — skipping SMS to", to);
    return;
  }

  // Normalise to E.164: 08012345678 → +2348012345678
  const stripped = to.replace(/[\s\-]/g, "");
  const e164 = stripped.startsWith("+")   ? stripped
             : stripped.startsWith("234") ? `+${stripped}`
             : `+234${stripped.replace(/^0/, "")}`;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const creds = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${creds}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: e164, From: TWILIO_FROM, Body: message }).toString(),
    });
    const data = await res.json() as { sid?: string; message?: string };
    if (!res.ok) console.error("[sms] Twilio error:", data);
    else console.log("[sms] Sent OK to", e164, "sid:", data.sid);
  } catch (err) {
    console.error("[sms] Twilio threw:", err);
  }
}
