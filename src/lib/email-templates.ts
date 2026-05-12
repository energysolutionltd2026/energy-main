const brand = {
  orange:     "#f97316",
  orangeDark: "#ea6a05",
  bg:         "#f4f4f5",
  card:       "#ffffff",
  border:     "#e4e4e7",
  text:       "#18181b",
  muted:      "#71717a",
  subtle:     "#a1a1aa",
  green:      "#16a34a",
  red:        "#dc2626",
  yellow:     "#d97706",
};

const base = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>e-Nergy</title>
</head>
<body style="margin:0;padding:0;background:${brand.bg};font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${brand.bg};padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;text-align:center;">
              <span style="font-size:30px;font-weight:900;color:${brand.orange};letter-spacing:-1.5px;">e</span><span style="font-size:30px;font-weight:900;color:${brand.text};letter-spacing:-1.5px;">-Nergy</span>
              <p style="margin:6px 0 0;font-size:10px;color:${brand.subtle};text-transform:uppercase;letter-spacing:3px;">Nigerian Fuel Distribution Platform</p>
            </td>
          </tr>

          <!-- Orange top bar -->
          <tr>
            <td style="background:linear-gradient(90deg,${brand.orange},${brand.orangeDark});height:4px;border-radius:8px 8px 0 0;"></td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${brand.card};border:1px solid ${brand.border};border-top:none;border-radius:0 0 16px 16px;padding:40px 40px 36px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;color:${brand.subtle};">
                &copy; ${new Date().getFullYear()} e-Nergy &nbsp;·&nbsp; Nigerian Fuel Distribution Platform
              </p>
              <p style="margin:0;font-size:11px;color:${brand.subtle};">
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
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:#fff7ed;border:2px solid ${brand.orange};border-radius:50%;width:56px;height:56px;line-height:56px;font-size:26px;">✉️</div>
      </div>

      <h1 style="margin:0 0 10px;font-size:22px;font-weight:800;color:${brand.text};text-align:center;">Verify your email address</h1>
      <p style="margin:0 0 32px;font-size:14px;color:${brand.muted};text-align:center;line-height:1.6;">
        Hi <strong style="color:${brand.text};">${name}</strong>, enter the code below to activate your e-Nergy account.
      </p>

      <!-- Code box -->
      <div style="background:#fff7ed;border:2px solid ${brand.orange};border-radius:14px;padding:32px 24px;text-align:center;margin-bottom:28px;">
        <p style="margin:0 0 8px;font-size:10px;font-weight:700;color:${brand.orange};text-transform:uppercase;letter-spacing:4px;">Verification Code</p>
        <p style="margin:0;font-size:48px;font-weight:900;color:${brand.text};letter-spacing:16px;font-family:'Courier New',monospace;">${code}</p>
        <p style="margin:14px 0 0;font-size:12px;color:${brand.muted};">⏱ Expires in ${expiresMinutes} minutes</p>
      </div>

      <div style="background:#fafafa;border-left:3px solid ${brand.orange};border-radius:4px;padding:14px 16px;">
        <p style="margin:0;font-size:12px;color:${brand.muted};line-height:1.7;">
          🔒 <strong style="color:${brand.text};">Never share this code</strong> with anyone. e-Nergy staff will never ask for your verification code.
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
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:#fff7ed;border:2px solid ${brand.orange};border-radius:50%;width:56px;height:56px;line-height:56px;font-size:26px;">🔑</div>
      </div>

      <h1 style="margin:0 0 10px;font-size:22px;font-weight:800;color:${brand.text};text-align:center;">Password Reset Request</h1>
      <p style="margin:0 0 32px;font-size:14px;color:${brand.muted};text-align:center;line-height:1.6;">
        Hi <strong style="color:${brand.text};">${name}</strong>, we received a request to reset your e-Nergy password.<br/>
        Click the button below to set a new password.
      </p>

      <div style="text-align:center;margin-bottom:28px;">
        <a href="${resetUrl}"
          style="display:inline-block;background:${brand.orange};color:#ffffff;font-size:15px;font-weight:700;
                 padding:15px 42px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
          Reset My Password
        </a>
      </div>

      <div style="background:#fafafa;border:1px solid ${brand.border};border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:11px;color:${brand.subtle};text-transform:uppercase;letter-spacing:1px;">Or copy this link:</p>
        <p style="margin:0;font-size:11px;color:${brand.muted};word-break:break-all;line-height:1.6;">${resetUrl}</p>
      </div>

      <div style="background:#fafafa;border-left:3px solid ${brand.subtle};border-radius:4px;padding:14px 16px;">
        <p style="margin:0;font-size:12px;color:${brand.muted};line-height:1.7;">
          This link expires in <strong style="color:${brand.text};">${expiresMinutes} minutes</strong>.
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
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:#fff7ed;border:2px solid ${brand.orange};border-radius:50%;width:56px;height:56px;line-height:56px;font-size:26px;">⛽</div>
      </div>

      <h1 style="margin:0 0 10px;font-size:22px;font-weight:800;color:${brand.text};text-align:center;">Supply Request Update</h1>
      <p style="margin:0 0 32px;font-size:14px;color:${brand.muted};text-align:center;line-height:1.6;">
        Hi <strong style="color:${brand.text};">${name}</strong>, your supply request status has been updated.
      </p>

      <div style="background:#fafafa;border:1px solid ${brand.border};border-radius:14px;padding:24px;margin-bottom:24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;font-size:12px;color:${brand.subtle};text-transform:uppercase;letter-spacing:1px;width:130px;">Request ID</td>
            <td style="padding:8px 0;font-size:13px;color:${brand.text};font-weight:600;">${requestId}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:12px;color:${brand.subtle};text-transform:uppercase;letter-spacing:1px;">Product</td>
            <td style="padding:8px 0;font-size:13px;color:${brand.text};">${product}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:12px;color:${brand.subtle};text-transform:uppercase;letter-spacing:1px;">Status</td>
            <td style="padding:8px 0;">
              <span style="background:${statusColor}18;color:${statusColor};font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;border:1px solid ${statusColor}44;">
                ${statusIcon} ${status}
              </span>
            </td>
          </tr>
        </table>
        ${adminNote ? `
          <div style="border-top:1px solid ${brand.border};margin-top:16px;padding-top:16px;">
            <p style="margin:0 0 4px;font-size:11px;color:${brand.subtle};text-transform:uppercase;letter-spacing:1px;">Admin Note</p>
            <p style="margin:0;font-size:13px;color:${brand.muted};line-height:1.6;">${adminNote}</p>
          </div>
        ` : ""}
      </div>

      <p style="margin:0;font-size:13px;color:${brand.muted};text-align:center;">Log in to your dashboard to view full details.</p>
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
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;background:#f0fdf4;border:2px solid ${brand.green};border-radius:50%;width:56px;height:56px;line-height:56px;font-size:26px;">✅</div>
      </div>

      <h1 style="margin:0 0 10px;font-size:22px;font-weight:800;color:${brand.text};text-align:center;">Payment Confirmed</h1>
      <p style="margin:0 0 32px;font-size:14px;color:${brand.muted};text-align:center;line-height:1.6;">
        Hi <strong style="color:${brand.text};">${name}</strong>, your payment has been received and confirmed.
      </p>

      <div style="background:#f0fdf4;border:2px solid ${brand.green};border-radius:14px;padding:32px 24px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 6px;font-size:10px;font-weight:700;color:${brand.green};text-transform:uppercase;letter-spacing:4px;">Amount Paid</p>
        <p style="margin:0;font-size:42px;font-weight:900;color:${brand.text};letter-spacing:-1px;">${amount}</p>
        <p style="margin:14px 0 0;font-size:12px;color:${brand.muted};">${type} &nbsp;·&nbsp; Ref: <strong style="color:${brand.text};">${reference}</strong></p>
      </div>

      <div style="background:#fafafa;border-left:3px solid ${brand.green};border-radius:4px;padding:14px 16px;">
        <p style="margin:0;font-size:12px;color:${brand.muted};line-height:1.7;">
          Your transaction has been recorded. Log in to your dashboard to view your full payment history.
        </p>
      </div>
    `),
  };
}
