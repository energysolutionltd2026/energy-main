import { Resend } from "resend";
import {
  verifyEmailTemplate,
  resetPasswordTemplate,
  supplyRequestStatusTemplate,
  paymentConfirmedTemplate,
  orderConfirmationTemplate,
} from "./email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@e-nergy.app";

async function send(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping send to", to);
    return;
  }
  console.log(`[email] Sending "${subject}" to ${to} from ${FROM}`);
  try {
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) console.error("[email] Resend error:", JSON.stringify(error));
    else console.log("[email] Sent OK, id:", data?.id);
  } catch (err) {
    console.error("[email] Resend threw:", err);
  }
}

export async function sendVerifyEmail(to: string, name: string, code: string) {
  const { subject, html } = verifyEmailTemplate({ name, code });
  await send(to, subject, html);
}

export async function sendResetPassword(to: string, name: string, resetUrl: string) {
  const { subject, html } = resetPasswordTemplate({ name, resetUrl });
  await send(to, subject, html);
}

export async function sendSupplyRequestStatus(
  to: string,
  opts: { name: string; requestId: string; product: string; status: string; adminNote?: string }
) {
  const { subject, html } = supplyRequestStatusTemplate(opts);
  await send(to, subject, html);
}

export async function sendOrderConfirmation(
  to: string,
  opts: { name: string; orderId: string; companyName: string; product: string; quantity: string; depot: string; paymentMethod: string }
) {
  const { subject, html } = orderConfirmationTemplate(opts);
  await send(to, subject, html);
}

export async function sendPaymentConfirmed(
  to: string,
  opts: { name: string; amount: string; reference: string; type: string }
) {
  const { subject, html } = paymentConfirmedTemplate(opts);
  await send(to, subject, html);
}
