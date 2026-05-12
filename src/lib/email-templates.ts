const brand = {
  orange:      "#f97316",
  orangeDark:  "#ea6a05",
  dark:        "#0a0a0a",
  card:        "#111111",
  cardBorder:  "#222222",
  innerCard:   "#1a1a1a",
  text:        "#f1f5f9",
  muted:       "#94a3b8",
  subtle:      "#475569",
  green:       "#22c55e",
  red:         "#ef4444",
  yellow:      "#f59e0b",
};

const base = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>e-Nergy</title>
</head>
<body style="margin:0;padding:0;background:${brand.dark};font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${brand.dark};padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background:${brand.orange};width:4px;border-radius:2px;">&nbsp;</td>
                  <td style="padding:0 14px;">
                    <span style="font-size:28px;font-weight:900;color:${brand.orange};letter-spacing:-1.5px;line-height:1;">e</span><span style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-1.5px;line-height:1;">-Nergy</span>
                  </td>
                  <td style="background:${brand.orange};width:4px;border-radius:2px;">&nbsp;</td>
                </tr>
              </table>
              <p style="margin:10px 0 0;font-size:10px;color:${brand.subtle};text-transform:uppercase;letter-spacing:3px;">Nigerian Fuel Distribution Platform</p>
            </td>
          </tr>

          <!-- Orange top bar -->
          <tr>
            <td style="background:linear-gradient(90deg,${brand.orange},${brand.orangeDark});height:4px;border-radius:8px 8px 0 0;"></td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${brand.card};border:1px solid ${brand.cardBorder};border-top:none;border-radius:0 0 16px 16px;padding:40px 40px 36px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;color:${brand.subtle};">
                &copy; ${new Date().getFullYear()} e-Nergy &nbsp;·&nbsp; Nigerian Fuel Distribution Platform
              </p>
              <p style="margin:0;font-size:11px;color:#2d3748;">
                You received this because you have an account on e-Nergy. If this wasn't you, ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

// ─── Verify Email ─────────────────────────────────────────────────────────────

export function verifyEmailTemplate({ name, code, expiresMinutes = 30 }: {
  name: string;
  code: string;
  expiresMinutes?: number;
}): { subject: string; html: string } {
  return {
    subject: `${code} is your e-Nergy verification code`,
    html: base(`
      <!-- Icon -->
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;background:#1a1a1a;border:2px solid ${brand.orange};border-radius:50%;width:60px;height:60px;line-height:60px;font-size:28px;text-align:center;">✉️</div>
      </div>

      <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#ffffff;text-align:center;">Verify your email address</h1>
      <p style="margin:0 0 32px;font-size:14px;color:${brand.muted};text-align:center;line-height:1.6;">
        Hi <strong style="color:#fff;">${name}</strong>, enter the code below to activate your e-Nergy account.
      </p>

      <!-- Code box -->
      <div style="background:${brand.innerCard};border:2px solid ${brand.orange};border-radius:14px;padding:32px 24px;text-align:center;margin-bottom:28px;">
        <p style="margin:0 0 8px;font-size:10px;font-weight:700;color:${brand.orange};text-transform:uppercase;letter-spacing:4px;">Verification Code</p>
        <p style="margin:0;font-size:48px;font-weight:900;color:#ffffff;letter-spacing:16px;font-family:'Courier New',monospace;">${code}</p>
        <div style="margin-top:16px;display:inline-block;background:#1f1f1f;border:1px solid #333;border-radius:20px;padding:5px 14px;">
          <p style="margin:0;font-size:11px;color:${brand.muted};">⏱ Expires in ${expiresMinutes} minutes</p>
        </div>
      </div>

      <div style="background:#1a1a1a;border-left:3px solid ${brand.orange};border-radius:4px;padding:14px 16px;">
        <p style="margin:0;font-size:12px;color:${brand.muted};line-height:1.7;">
          🔒 <strong style="color:#fff;">Never share this code</strong> with anyone. e-Nergy staff will never ask for your verification code.
        </p>
      </div>
    `),
  };
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export function resetPasswordTemplate({ name, resetUrl, expiresMinutes = 30 }: {
  name: string;
  resetUrl: string;
  expiresMinutes?: number;
}): { subject: string; html: string } {
  return {
    subject: "Reset your e-Nergy password",
    html: base(`
      <!-- Icon -->
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;background:#1a1a1a;border:2px solid ${brand.orange};border-radius:50%;width:60px;height:60px;line-height:60px;font-size:28px;text-align:center;">🔑</div>
      </div>

      <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#ffffff;text-align:center;">Password Reset Request</h1>
      <p style="margin:0 0 32px;font-size:14px;color:${brand.muted};text-align:center;line-height:1.6;">
        Hi <strong style="color:#fff;">${name}</strong>, we received a request to reset your e-Nergy password.<br/>
        Click the button below to set a new password.
      </p>

      <!-- CTA button -->
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${resetUrl}"
          style="display:inline-block;background:${brand.orange};color:#ffffff;font-size:15px;font-weight:700;
                 padding:15px 42px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;
                 box-shadow:0 4px 14px rgba(249,115,22,0.35);">
          Reset My Password
        </a>
      </div>

      <!-- Fallback URL -->
      <div style="background:${brand.innerCard};border:1px solid ${brand.cardBorder};border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:11px;color:${brand.subtle};text-transform:uppercase;letter-spacing:1px;">Or copy this link:</p>
        <p style="margin:0;font-size:11px;color:${brand.muted};word-break:break-all;line-height:1.6;">${resetUrl}</p>
      </div>

      <div style="background:#1a1a1a;border-left:3px solid ${brand.subtle};border-radius:4px;padding:14px 16px;">
        <p style="margin:0;font-size:12px;color:${brand.muted};line-height:1.7;">
          This link expires in <strong style="color:#fff;">${expiresMinutes} minutes</strong>.
          If you didn't request a password reset, your account is safe — no action needed.
        </p>
      </div>
    `),
  };
}

// ─── Supply Request Status ────────────────────────────────────────────────────

export function supplyRequestStatusTemplate({ name, requestId, product, status, adminNote }: {
  name: string;
  requestId: string;
  product: string;
  status: string;
  adminNote?: string;
}): { subject: string; html: string } {
  const isApproved = status === "Approved";
  const isPending  = status === "Pending";
  const statusColor = isApproved ? brand.green : isPending ? brand.yellow : brand.red;
  const statusIcon  = isApproved ? "✅" : isPending ? "⏳" : "❌";

  return {
    subject: `Supply request ${requestId} — ${status}`,
    html: base(`
      <!-- Icon -->
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;background:#1a1a1a;border:2px solid ${brand.orange};border-radius:50%;width:60px;height:60px;line-height:60px;font-size:28px;text-align:center;">⛽</div>
      </div>

      <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#ffffff;text-align:center;">Supply Request Update</h1>
      <p style="margin:0 0 32px;font-size:14px;color:${brand.muted};text-align:center;line-height:1.6;">
        Hi <strong style="color:#fff;">${name}</strong>, your supply request status has been updated.
      </p>

      <!-- Status card -->
      <div style="background:${brand.innerCard};border:1px solid ${brand.cardBorder};border-radius:14px;padding:24px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;font-size:12px;color:${brand.subtle};text-transform:uppercase;letter-spacing:1px;width:130px;">Request ID</td>
            <td style="padding:8px 0;font-size:13px;color:#fff;font-weight:600;">${requestId}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:12px;color:${brand.subtle};text-transform:uppercase;letter-spacing:1px;">Product</td>
            <td style="padding:8px 0;font-size:13px;color:#fff;">${product}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:12px;color:${brand.subtle};text-transform:uppercase;letter-spacing:1px;">Status</td>
            <td style="padding:8px 0;">
              <span style="background:${statusColor}22;color:${statusColor};font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;border:1px solid ${statusColor}55;">
                ${statusIcon} ${status}
              </span>
            </td>
          </tr>
        </table>
        ${adminNote ? `
          <div style="border-top:1px solid ${brand.cardBorder};margin-top:16px;padding-top:16px;">
            <p style="margin:0 0 4px;font-size:11px;color:${brand.subtle};text-transform:uppercase;letter-spacing:1px;">Admin Note</p>
            <p style="margin:0;font-size:13px;color:${brand.text};line-height:1.6;">${adminNote}</p>
          </div>
        ` : ""}
      </div>

      <div style="text-align:center;">
        <p style="margin:0;font-size:13px;color:${brand.muted};">Log in to your dashboard to view full details.</p>
      </div>
    `),
  };
}

// ─── Payment Confirmed ────────────────────────────────────────────────────────

export function paymentConfirmedTemplate({ name, amount, reference, type }: {
  name: string;
  amount: string;
  reference: string;
  type: string;
}): { subject: string; html: string } {
  return {
    subject: `Payment confirmed — ${reference}`,
    html: base(`
      <!-- Icon -->
      <div style="text-align:center;margin-bottom:28px;">
        <div style="display:inline-block;background:#1a1a1a;border:2px solid ${brand.green};border-radius:50%;width:60px;height:60px;line-height:60px;font-size:28px;text-align:center;">✅</div>
      </div>

      <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#ffffff;text-align:center;">Payment Confirmed</h1>
      <p style="margin:0 0 32px;font-size:14px;color:${brand.muted};text-align:center;line-height:1.6;">
        Hi <strong style="color:#fff;">${name}</strong>, your payment has been received and confirmed.
      </p>

      <!-- Amount box -->
      <div style="background:${brand.innerCard};border:2px solid ${brand.green};border-radius:14px;padding:32px 24px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:10px;font-weight:700;color:${brand.green};text-transform:uppercase;letter-spacing:4px;">Amount Paid</p>
        <p style="margin:0;font-size:42px;font-weight:900;color:#ffffff;letter-spacing:-1px;">${amount}</p>
        <div style="margin-top:16px;display:inline-block;background:#1f1f1f;border:1px solid #333;border-radius:20px;padding:6px 16px;">
          <p style="margin:0;font-size:11px;color:${brand.muted};">${type} &nbsp;·&nbsp; Ref: <strong style="color:#fff;">${reference}</strong></p>
        </div>
      </div>

      <div style="background:#1a1a1a;border-left:3px solid ${brand.green};border-radius:4px;padding:14px 16px;">
        <p style="margin:0;font-size:12px;color:${brand.muted};line-height:1.7;">
          Your transaction has been recorded. Log in to your dashboard to view your full payment history.
        </p>
      </div>
    `),
  };
}
