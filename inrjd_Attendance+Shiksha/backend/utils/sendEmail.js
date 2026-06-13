const nodemailer = require("nodemailer");

// ─────────────────────────────────────────────────────────────────
// CORE SENDER — never throws, so email failures never crash the app
// ─────────────────────────────────────────────────────────────────
const sendMail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log(`📧 Email sent → ${to} | ${subject}`);
  } catch (err) {
    // ✅ Swallow error — email failure must NEVER crash the main flow
    // The DB operation already succeeded; just log and continue
    console.error(`❌ Email failed → ${to} | ${err.message}`);
  }
};

// ─── SHARED HTML WRAPPER ──────────────────────────────────────
const wrap = (headerSub, bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'DM Sans', 'Helvetica Neue', Arial, sans-serif;
      background: #110800;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }

    /* ── OUTER WRAPPER ── */
    .email-bg {
      background:
        radial-gradient(ellipse 70% 45% at 50% 0%,   rgba(196,111,30,0.22) 0%, transparent 65%),
        radial-gradient(ellipse 50% 35% at 90% 100%,  rgba(120,50,10,0.18)  0%, transparent 55%),
        radial-gradient(ellipse 40% 30% at 0%   80%,  rgba(160,80,10,0.12)  0%, transparent 55%),
        #110800;
      padding: 48px 16px 56px;
    }

    /* ── MAIN CARD ── */
    .container {
      max-width: 600px;
      width: 100%;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 24px;
      overflow: hidden;
      box-shadow:
        0 0 0 1px rgba(196,111,30,0.2),
        0 2px 4px  rgba(0,0,0,0.3),
        0 12px 48px rgba(0,0,0,0.55),
        0 40px 96px rgba(0,0,0,0.35);
    }

    /* ═══════════════════════════════
       HEADER
    ═══════════════════════════════ */
    .header {
      background:
        linear-gradient(150deg,
          #0f0500  0%,
          #2c1000 28%,
          #5a2200 56%,
          #8c3a0a 80%,
          #b85010 100%
        );
      padding: 48px 44px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }

    .header::before {
      content: '';
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 60% 55% at 50% -5%,  rgba(230,150,50,0.18) 0%, transparent 65%),
        radial-gradient(ellipse 30% 20% at 80% 100%, rgba(255,160,40,0.10) 0%, transparent 50%);
      pointer-events: none;
    }

    .header::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(212,150,60,0.3) 20%,
        rgba(255,210,90,0.85) 50%,
        rgba(212,150,60,0.3) 80%,
        transparent 100%
      );
    }

    .header-ornament {
      font-size: 40px;
      line-height: 1;
      margin-bottom: 16px;
      display: block;
      position: relative;
      filter: drop-shadow(0 0 18px rgba(255,180,60,0.5));
    }

    .header h1 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      color: #f8ead4;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.08em;
      margin-bottom: 4px;
      position: relative;
    }

    .header-divider {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 12px 0 10px;
      position: relative;
    }

    .header-divider span {
      height: 1px;
      width: 52px;
      background: linear-gradient(90deg, transparent, rgba(212,150,60,0.55));
    }

    .header-divider span:last-child {
      background: linear-gradient(90deg, rgba(212,150,60,0.55), transparent);
    }

    .header-divider em {
      color: rgba(212,150,60,0.75);
      font-size: 9.5px;
      font-style: normal;
      letter-spacing: 0.35em;
      text-transform: uppercase;
    }

    .header p {
      color: rgba(245,215,160,0.65);
      font-size: 11.5px;
      font-weight: 400;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      position: relative;
    }

    /* ═══════════════════════════════
       BODY
    ═══════════════════════════════ */
    .body {
      padding: 42px 44px 36px;
      background: #ffffff;
    }

    .body h2 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      color: #1a0800;
      font-size: 25px;
      font-weight: 700;
      margin-bottom: 14px;
      line-height: 1.3;
      letter-spacing: 0.01em;
    }

    .body p {
      color: #4a3220;
      line-height: 1.85;
      font-size: 14px;
      margin-bottom: 14px;
      font-weight: 400;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    .body p strong {
      color: #2a1000;
      font-weight: 600;
    }

    /* ═══════════════════════════════
       DETAIL TABLE  ←  THE FIXED PART
    ═══════════════════════════════

      Root cause of the overlap was max-width:0 on .detail-value.
      Fix: table-layout:fixed + a % width only on the label column.
      The value column automatically gets all remaining width.
      No max-width:0 anywhere.
    */
    .detail-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      table-layout: fixed;
      margin: 22px 0;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid rgba(196,140,60,0.18);
      box-shadow:
        0 1px 3px  rgba(160,100,20,0.06),
        0 4px 16px rgba(160,100,20,0.06);
    }

    .detail-table tr:nth-child(odd) td  { background: #fefcf7; }
    .detail-table tr:nth-child(even) td { background: #faf3e8; }

    .detail-table tr:not(:last-child) td {
      border-bottom: 1px solid rgba(196,140,60,0.12);
    }

    /* ── LABEL CELL ── */
    .detail-label {
      width: 37%;                        /* Fixed %; value gets remaining 63% */
      padding: 15px 14px 15px 20px;
      vertical-align: top;
      border-right: 1px solid rgba(196,140,60,0.15);
      position: relative;
    }

    /* Amber left accent bar */
    .detail-label::before {
      content: '';
      position: absolute;
      left: 0;
      top: 22%;
      bottom: 22%;
      width: 3px;
      border-radius: 0 2px 2px 0;
      background: linear-gradient(180deg, #e8a84a 0%, #c47820 100%);
      opacity: 0.75;
    }

    /* Label inner text wrapper — keeps the ::before pseudo from conflicting */
    .detail-label-text {
      display: block;
      color: #9a6020;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 9.5px;
      letter-spacing: 0.7px;
      line-height: 1.5;
    }

    /* ── VALUE CELL ── */
    .detail-value {
      /* auto width = 63% of table  — DO NOT set max-width:0 here */
      padding: 15px 18px 15px 16px;
      vertical-align: top;
      color: #1a0800;
      font-weight: 500;
      font-size: 13.5px;
      line-height: 1.65;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    /* Inline credential badge (password / temp key) */
    .detail-value span[style*="monospace"] {
      display: inline-block !important;
      font-family: 'Courier New', Courier, monospace !important;
      background: linear-gradient(135deg, #fef0d6, #fde8bf) !important;
      color: #7c3800 !important;
      border: 1px solid rgba(196,130,40,0.3) !important;
      padding: 6px 16px !important;
      border-radius: 8px !important;
      font-size: 14px !important;
      letter-spacing: 2.5px !important;
      font-weight: 700 !important;
      word-break: break-all !important;
      overflow-wrap: break-word !important;
      max-width: 100% !important;
      box-shadow: inset 0 1px 3px rgba(180,100,0,0.08) !important;
    }

    /* ═══════════════════════════════
       ALERT BOXES
    ═══════════════════════════════ */
    .info-box,
    .warn-box,
    .success-box,
    .purple-box {
      padding: 16px 20px;
      border-radius: 12px;
      margin: 20px 0;
    }

    .info-box p,
    .warn-box p,
    .success-box p,
    .purple-box p {
      margin: 0;
      font-size: 13.5px;
      line-height: 1.75;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    .info-box {
      background: linear-gradient(135deg, #fef8ed 0%, #fdf1d6 100%);
      border: 1px solid rgba(196,140,60,0.3);
      border-left: 4px solid #c8963c;
    }
    .info-box p { color: #6b3e00; }

    .warn-box {
      background: linear-gradient(135deg, #fff5f5 0%, #ffecec 100%);
      border: 1px solid rgba(220,60,80,0.22);
      border-left: 4px solid #e11d48;
    }
    .warn-box p { color: #850020; }

    .success-box {
      background: linear-gradient(135deg, #f0fdf5 0%, #e6faf0 100%);
      border: 1px solid rgba(22,163,74,0.22);
      border-left: 4px solid #16a34a;
    }
    .success-box p { color: #0e4526; }

    .purple-box {
      background: linear-gradient(135deg, #f8f5ff 0%, #f1ecff 100%);
      border: 1px solid rgba(124,58,237,0.22);
      border-left: 4px solid #7c3aed;
    }
    .purple-box p { color: #3b0f8c; }

    /* ═══════════════════════════════
       BUTTONS
    ═══════════════════════════════ */
    .btn {
      display: inline-block;
      text-decoration: none;
      padding: 13px 32px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 13.5px;
      letter-spacing: 0.03em;
      margin: 4px 4px;
      color: #ffffff;
      line-height: 1;
    }

    .btn-primary {
      background: linear-gradient(135deg, #c44f00 0%, #7c2800 100%);
      box-shadow:
        0 2px 0 rgba(0,0,0,0.25),
        0 4px 18px rgba(180,70,0,0.38),
        inset 0 1px 0 rgba(255,180,100,0.25);
    }

    .btn-approve {
      background: linear-gradient(135deg, #16a34a 0%, #0a5e2a 100%);
      box-shadow:
        0 2px 0 rgba(0,0,0,0.2),
        0 4px 18px rgba(22,163,74,0.32),
        inset 0 1px 0 rgba(120,255,160,0.18);
    }

    .btn-reject {
      background: linear-gradient(135deg, #dc2626 0%, #8b1616 100%);
      box-shadow:
        0 2px 0 rgba(0,0,0,0.2),
        0 4px 18px rgba(220,38,38,0.32),
        inset 0 1px 0 rgba(255,120,120,0.18);
    }

    /* ═══════════════════════════════
       SECTION DIVIDER
    ═══════════════════════════════ */
    .divider {
      display: flex;
      align-items: center;
      gap: 14px;
      margin: 28px 0;
    }

    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(196,140,60,0.22));
    }

    .divider::after {
      background: linear-gradient(90deg, rgba(196,140,60,0.22), transparent);
    }

    .divider span {
      color: rgba(196,140,60,0.45);
      font-size: 11px;
      letter-spacing: 0.35em;
    }

    /* ═══════════════════════════════
       FOOTER
    ═══════════════════════════════ */
    .footer {
      background: linear-gradient(180deg, #180a01 0%, #0d0500 100%);
      padding: 30px 44px 36px;
      text-align: center;
      border-top: 1px solid rgba(196,111,30,0.18);
      position: relative;
      overflow: hidden;
    }

    .footer::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 40px;
      background: radial-gradient(ellipse 60% 100% at 50% 0%, rgba(196,111,30,0.12) 0%, transparent 100%);
      pointer-events: none;
    }

    .footer-logo {
      font-family: 'Cormorant Garamond', Georgia, serif;
      color: rgba(212,150,60,0.72);
      font-size: 16px;
      letter-spacing: 0.12em;
      margin-bottom: 8px;
      position: relative;
    }

    .footer-divider {
      width: 56px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(196,140,60,0.35), transparent);
      margin: 10px auto;
    }

    .footer-no-reply {
      display: inline-block;
      margin: 6px auto 10px;
      padding: 6px 20px;
      background: rgba(196,111,30,0.1);
      border: 1px solid rgba(196,111,30,0.22);
      border-radius: 20px;
      color: rgba(212,150,60,0.7);
      font-size: 10.5px;
      letter-spacing: 0.06em;
      font-weight: 500;
    }

    .footer p {
      color: rgba(160,110,60,0.5);
      font-size: 11px;
      line-height: 2;
      word-break: break-word;
      overflow-wrap: break-word;
      position: relative;
    }

    .mantra {
      color: rgba(212,150,60,0.55);
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 16px;
      margin-top: 10px;
      letter-spacing: 0.06em;
      font-style: italic;
      position: relative;
    }

    /* ═══════════════════════════════
       RESPONSIVE
    ═══════════════════════════════ */
    @media only screen and (max-width: 620px) {
      .email-bg  { padding: 24px 10px 32px; }
      .container { border-radius: 18px; }
      .header    { padding: 36px 24px 30px; }
      .header h1 { font-size: 23px; }
      .body      { padding: 28px 22px 24px; }
      .body h2   { font-size: 20px; }

      .detail-label       { width: 34%; padding: 12px 10px 12px 16px; }
      .detail-value       { padding: 12px 14px; font-size: 13px; }
      .detail-label-text  { font-size: 8.5px; letter-spacing: 0.5px; }

      .btn {
        display: block;
        text-align: center;
        margin: 7px 0;
        padding: 14px 20px;
      }

      .footer { padding: 26px 22px 30px; }
    }
  </style>
</head>
<body>
<div class="email-bg">
<div class="container">

  <div class="header">
    <span class="header-ornament">🪷</span>
    <h1>Sacred Portal</h1>
    <div class="header-divider">
      <span></span>
      <em>divine management system</em>
      <span></span>
    </div>
    <p>${headerSub}</p>
  </div>

  <div class="body">${bodyContent}</div>

  <div class="footer">
    <div class="footer-logo">🪷 Sacred Portal</div>
    <div class="footer-divider"></div>
    <span class="footer-no-reply">📭 Do not reply — this mailbox is not monitored</span>
    <p>© ${new Date().getFullYear()} Sacred Portal · Program Management System</p>
    <p>This is an automated system notification. Please do not reply to this email.</p>
    <div class="footer-divider" style="margin-top:14px"></div>
    <p class="mantra">ॐ सर्वे भवन्तु सुखिनः</p>
  </div>

</div>
</div>
</body>
</html>`;

const fmt = () =>
  new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }) + " IST";

// ══════════════════════════════════════════════════════════════
// 1. ACCOUNT CREATED
// ══════════════════════════════════════════════════════════════
const sendAccountCreatedEmail = async ({
  toEmail,
  toName,
  role,
  provider,
  tempPassword,
}) => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;
  const isGoogle = provider === "google";

  const html = wrap(
    "Your Account Has Been Created",
    `
    <h2>Welcome to the Sacred Portal, ${toName} 🙏</h2>
    <p>We're honoured to have you. Your <strong>${role}</strong> account is fully set up and ready to use. Below are your account details for reference.</p>

    <table class="detail-table">
      <tr>
        <td class="detail-label"><span class="detail-label-text">Full Name</span></td>
        <td class="detail-value">${toName}</td>
      </tr>
      <tr>
        <td class="detail-label"><span class="detail-label-text">Email Address</span></td>
        <td class="detail-value">${toEmail}</td>
      </tr>
      <tr>
        <td class="detail-label"><span class="detail-label-text">Assigned Role</span></td>
        <td class="detail-value" style="text-transform:capitalize">${role}</td>
      </tr>
      <tr>
        <td class="detail-label"><span class="detail-label-text">Sign-in Method</span></td>
        <td class="detail-value">${isGoogle ? "Google Sign-In" : "Email & Password"}</td>
      </tr>
      ${
        !isGoogle && tempPassword
          ? `<tr>
              <td class="detail-label"><span class="detail-label-text">Temp Password</span></td>
              <td class="detail-value">
                <span style="display:inline-block;font-family:monospace;background:linear-gradient(135deg,#fef0d6,#fde8bf);color:#7c3800;border:1px solid rgba(196,130,40,0.3);padding:6px 16px;border-radius:8px;font-size:14px;letter-spacing:2.5px;font-weight:700;word-break:break-all;overflow-wrap:break-word;max-width:100%">${tempPassword}</span>
              </td>
            </tr>`
          : ""
      }
    </table>

    ${
      isGoogle
        ? `<div class="info-box"><p>ℹ️ Your account uses <strong>Google Sign-In</strong>. Simply click "Continue with Google" on the login page using the email address above — no password needed.</p></div>`
        : `<div class="warn-box"><p>⚠️ The password shown above is <strong>temporary</strong>. For your security, you will be prompted to set a new password on your very first login. Please do not share this credential with anyone.</p></div>`
    }

    <div class="divider"><span>✦</span></div>

    <p style="text-align:center;margin-top:4px">
      <a href="${loginUrl}" class="btn btn-primary">Sign In to Sacred Portal →</a>
    </p>
    <p style="text-align:center;font-size:12px;color:#a08060;margin-top:10px">If you did not expect this email, please contact your administrator immediately.</p>
  `
  );

  await sendMail({
    to: toEmail,
    subject: "🪷 Your Sacred Portal Account is Ready",
    html,
  });
};

// ══════════════════════════════════════════════════════════════
// 2. PASSWORD RESET
// ══════════════════════════════════════════════════════════════
const sendPasswordResetEmail = async ({
  toEmail,
  toName,
  resetLink,
  triggeredByAdmin = false,
}) => {
  const html = wrap(
    "Password Reset Request",
    `
    <h2>Reset Your Password 🔐</h2>
    <p>Hello <strong>${toName}</strong>,</p>
    <p>${
      triggeredByAdmin
        ? "An <strong>administrator</strong> has initiated a password reset on behalf of your account. Use the button below to create a new secure password."
        : "We received a request to reset the password for your Sacred Portal account. If this was you, click the button below to proceed."
    }</p>

    <div class="divider"><span>✦</span></div>

    <p style="text-align:center;margin:28px 0 20px">
      <a href="${resetLink}" class="btn btn-primary">Reset My Password →</a>
    </p>

    <div class="warn-box">
      <p>⏱ For your security, this reset link will <strong>expire in 15 minutes</strong> and is valid for a single use only. If it expires, please request a new one.</p>
    </div>
    <p style="font-size:12.5px;color:#9a7850;margin-top:6px">If you did not request a password reset, no action is required — your account remains secure and unchanged.</p>
  `
  );

  await sendMail({
    to: toEmail,
    subject: "🔐 Reset Your Password — Sacred Portal",
    html,
  });
};

// ══════════════════════════════════════════════════════════════
// 3. ADMIN SET PASSWORD
// ══════════════════════════════════════════════════════════════
const sendAdminSetPasswordEmail = async ({ toEmail, toName, tempPassword }) => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;

  const html = wrap(
    "Password Updated by Administrator",
    `
    <h2>Your Password Has Been Reset 🔑</h2>
    <p>Hello <strong>${toName}</strong>,</p>
    <p>An administrator has assigned a new temporary password to your Sacred Portal account. You can use the credentials below to sign in right away.</p>

    <table class="detail-table">
      <tr>
        <td class="detail-label"><span class="detail-label-text">Email Address</span></td>
        <td class="detail-value">${toEmail}</td>
      </tr>
      <tr>
        <td class="detail-label"><span class="detail-label-text">Temp Password</span></td>
        <td class="detail-value">
          <span style="display:inline-block;font-family:monospace;background:linear-gradient(135deg,#fef0d6,#fde8bf);color:#7c3800;border:1px solid rgba(196,130,40,0.3);padding:6px 16px;border-radius:8px;font-size:14px;letter-spacing:2.5px;font-weight:700;word-break:break-all;overflow-wrap:break-word;max-width:100%">${tempPassword}</span>
        </td>
      </tr>
    </table>

    <div class="warn-box">
      <p>⚠️ This is a <strong>temporary credential</strong>. You will be required to set a new personal password immediately upon your next login. Never share your credentials with anyone — including administrators.</p>
    </div>

    <div class="divider"><span>✦</span></div>

    <p style="text-align:center;margin-top:4px">
      <a href="${loginUrl}" class="btn btn-primary">Sign In &amp; Update Password →</a>
    </p>
  `
  );

  await sendMail({
    to: toEmail,
    subject: "🔑 New Temporary Password — Action Required",
    html,
  });
};

// ══════════════════════════════════════════════════════════════
// 4. ACCOUNT DEACTIVATED
// ══════════════════════════════════════════════════════════════
const sendAccountDeactivatedEmail = async ({ toEmail, toName, adminName }) => {
  const html = wrap(
    "Account Access Suspended",
    `
    <h2>Your Account Has Been Deactivated</h2>
    <p>Hello <strong>${toName}</strong>,</p>
    <p>We're writing to let you know that your Sacred Portal account has been <strong>temporarily deactivated</strong>. During this period, you will not be able to sign in or access any portal resources.</p>

    <table class="detail-table">
      <tr>
        <td class="detail-label"><span class="detail-label-text">Account</span></td>
        <td class="detail-value">${toEmail}</td>
      </tr>
      <tr>
        <td class="detail-label"><span class="detail-label-text">Deactivated At</span></td>
        <td class="detail-value">${fmt()}</td>
      </tr>
      ${
        adminName
          ? `<tr>
              <td class="detail-label"><span class="detail-label-text">Action By</span></td>
              <td class="detail-value">${adminName}</td>
            </tr>`
          : ""
      }
    </table>

    <div class="warn-box">
      <p>🚫 Your access has been suspended. If you believe this was done in error or would like to request a review, please reach out to your system administrator directly.</p>
    </div>

    <p style="font-size:12.5px;color:#9a7850;margin-top:8px">This action was carried out through the Sacred Portal management system. No sensitive data has been removed from your account.</p>
  `
  );

  await sendMail({
    to: toEmail,
    subject: "⚠️ Your Sacred Portal Account Has Been Deactivated",
    html,
  });
};

// ══════════════════════════════════════════════════════════════
// 5. ACCOUNT REACTIVATED
// ══════════════════════════════════════════════════════════════
const sendAccountReactivatedEmail = async ({ toEmail, toName }) => {
  const loginUrl = `${process.env.FRONTEND_URL}/login`;

  const html = wrap(
    "Account Access Restored",
    `
    <h2>Welcome Back, ${toName}! 🌅</h2>
    <p>Great news — your Sacred Portal account has been <strong>successfully reactivated</strong>. All your previous access and permissions have been fully restored.</p>

    <table class="detail-table">
      <tr>
        <td class="detail-label"><span class="detail-label-text">Account</span></td>
        <td class="detail-value">${toEmail}</td>
      </tr>
      <tr>
        <td class="detail-label"><span class="detail-label-text">Reactivated At</span></td>
        <td class="detail-value">${fmt()}</td>
      </tr>
    </table>

    <div class="success-box">
      <p>✅ Your account is fully active and all portal features are accessible once again. We're glad to have you back.</p>
    </div>

    <div class="divider"><span>✦</span></div>

    <p style="text-align:center;margin-top:4px">
      <a href="${loginUrl}" class="btn btn-primary">Sign In to Sacred Portal →</a>
    </p>
  `
  );

  await sendMail({
    to: toEmail,
    subject: "✅ Your Sacred Portal Account Has Been Reactivated",
    html,
  });
};

// ══════════════════════════════════════════════════════════════
// 6. DEACTIVATION REQUEST → SUPERADMIN
// Sent when any admin requests to deactivate any account
// ══════════════════════════════════════════════════════════════
const sendDeactivationRequestEmail = async ({
  toEmail,
  toName,
  requestedByName,
  targetName,
  targetEmail,
  targetRole,
  reason,
  approveLink,
  rejectLink,
}) => {
  const html = wrap(
    "Action Required — Approval Pending",
    `
    <h2>Deactivation Approval Required 🔔</h2>
    <p>Hello <strong>${toName}</strong>,</p>
    <p>An administrator has submitted a formal request to <strong>deactivate</strong> the account listed below. As SuperAdmin, your explicit approval is required before any action can be taken on this account.</p>

    <table class="detail-table">
      <tr>
        <td class="detail-label"><span class="detail-label-text">Requested By</span></td>
        <td class="detail-value">${requestedByName}</td>
      </tr>
      <tr>
        <td class="detail-label"><span class="detail-label-text">Target Account</span></td>
        <td class="detail-value">${targetName}</td>
      </tr>
      <tr>
        <td class="detail-label"><span class="detail-label-text">Email Address</span></td>
        <td class="detail-value">${targetEmail}</td>
      </tr>
      <tr>
        <td class="detail-label"><span class="detail-label-text">Account Role</span></td>
        <td class="detail-value" style="text-transform:capitalize">${targetRole}</td>
      </tr>
      <tr>
        <td class="detail-label"><span class="detail-label-text">Stated Reason</span></td>
        <td class="detail-value">${reason || "No reason provided"}</td>
      </tr>
    </table>

    <div class="warn-box">
      <p>⚠️ If approved, this account will be <strong>immediately deactivated</strong> and the user will receive an automated notification. This action can be reversed at any time.</p>
    </div>

    <div class="divider"><span>✦</span></div>

    <p style="text-align:center;margin:20px 0 8px">
      <a href="${approveLink}" class="btn btn-approve">✅ Approve Deactivation</a>
      &nbsp;&nbsp;
      <a href="${rejectLink}" class="btn btn-reject">❌ Reject Request</a>
    </p>
    <p style="text-align:center;font-size:12px;color:#a08060;margin-top:10px">These action links are single-use and expire after the request is resolved.</p>
  `
  );

  await sendMail({
    to: toEmail,
    subject: `🔔 Approval Needed: Deactivate ${targetName}'s Account`,
    html,
  });
};

// ══════════════════════════════════════════════════════════════
// 7. DEACTIVATION REQUEST RESULT → REQUESTING ADMIN
// ══════════════════════════════════════════════════════════════
const sendDeactivationResultEmail = async ({
  toEmail,
  toName,
  targetName,
  status,
  note,
}) => {
  const approved = status === "approved";

  const html = wrap(
    `Request ${approved ? "Approved" : "Rejected"} by SuperAdmin`,
    `
    <h2>${approved ? "Request Approved ✅" : "Request Rejected ❌"}</h2>
    <p>Hello <strong>${toName}</strong>,</p>
    <p>The SuperAdmin has reviewed your deactivation request for <strong>${targetName}</strong>'s account and has <strong>${
      approved ? "approved" : "rejected"
    }</strong> the request.</p>

    ${
      note
        ? `<div class="info-box"><p><strong>Note from SuperAdmin:</strong><br/>${note}</p></div>`
        : ""
    }

    ${
      approved
        ? `<div class="success-box"><p>✅ The account has been <strong>successfully deactivated</strong>. An automated notification has been sent to the account holder informing them of the suspension.</p></div>`
        : `<div class="warn-box"><p>🚫 The deactivation request was not approved. The account remains <strong>fully active</strong> and no changes have been made. Please contact the SuperAdmin if you have further concerns.</p></div>`
    }

    <p style="font-size:12.5px;color:#9a7850;margin-top:8px">This is an automated outcome notification from the Sacred Portal management system.</p>
  `
  );

  await sendMail({
    to: toEmail,
    subject: `${approved ? "✅" : "❌"} Deactivation Request ${
      approved ? "Approved" : "Rejected"
    }`,
    html,
  });
};

module.exports = {
  sendAccountCreatedEmail,
  sendPasswordResetEmail,
  sendAdminSetPasswordEmail,
  sendAccountDeactivatedEmail,
  sendAccountReactivatedEmail,
  sendDeactivationRequestEmail,
  sendDeactivationResultEmail,
};