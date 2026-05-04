import nodemailer from 'nodemailer'

/**
 * Email service using nodemailer with SMTP configuration.
 * All functions gracefully handle missing SMTP config (log warning instead of error).
 */

const APP_NAME = 'CloudSpace'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

function getEmailConfig(): EmailConfig | null {
  if (!process.env.SMTP_HOST) return null

  return {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || `${APP_NAME} <noreply@cloudspace.app>`,
  }
}

let transporterInstance: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter | null {
  if (transporterInstance) return transporterInstance

  const config = getEmailConfig()
  if (!config) return null

  transporterInstance = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })

  return transporterInstance
}

/** Common email wrapper */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const config = getEmailConfig()
  if (!config) {
    console.warn(`[Email] SMTP not configured. Email to ${to} not sent: "${subject}"`)
    return false
  }

  const transporter = getTransporter()
  if (!transporter) return false

  try {
    await transporter.sendMail({
      from: config.from,
      to,
      subject,
      html,
    })
    return true
  } catch (error) {
    console.error(`[Email] Failed to send email to ${to}:`, error)
    return false
  }
}

/** Common HTML wrapper template */
function wrapEmail(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 40px; text-align: center; }
    .header h1 { margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header .logo { font-size: 32px; margin-bottom: 4px; }
    .body { padding: 32px 40px; color: #334155; line-height: 1.6; }
    .body h2 { margin: 0 0 16px 0; color: #0f172a; font-size: 20px; }
    .body p { margin: 0 0 16px 0; }
    .btn { display: inline-block; padding: 14px 32px; background: #0f172a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0; }
    .btn:hover { background: #1e293b; }
    .footer { padding: 24px 40px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 13px; }
    .footer a { color: #64748b; text-decoration: none; }
    .divider { height: 1px; background: #e2e8f0; margin: 24px 0; }
    .highlight { background: #f1f5f9; border-left: 4px solid #0f172a; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">☁️</div>
      <h1>${APP_NAME}</h1>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
      <p><a href="${APP_URL}">${APP_URL}</a></p>
    </div>
  </div>
</body>
</html>`
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`

  const content = `
    <h2>Password Reset Request</h2>
    <p>We received a request to reset your password. Click the button below to choose a new one:</p>
    <p style="text-align: center;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </p>
    <div class="highlight">
      <strong>Important:</strong> This link will expire in <strong>1 hour</strong>. If you didn't request this password reset, please ignore this email — your account is safe.
    </div>
    <p>Alternatively, you can copy and paste this URL into your browser:</p>
    <p style="word-break: break-all; color: #64748b; font-size: 14px;">${resetUrl}</p>
  `

  return sendEmail(to, `${APP_NAME} — Password Reset`, wrapEmail('Password Reset', content))
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail(to: string, name: string): Promise<boolean> {
  const content = `
    <h2>Welcome to ${APP_NAME}, ${name}! 👋</h2>
    <p>Your account has been successfully created. You're all set to start building and deploying cloud workspaces.</p>
    <p style="text-align: center;">
      <a href="${APP_URL}" class="btn">Go to Dashboard</a>
    </p>
    <div class="highlight">
      <strong>Getting Started:</strong><br>
      ✅ Create your first workspace<br>
      ✅ Choose your preferred plan<br>
      ✅ Configure your development environment
    </div>
    <p>If you have any questions, our support team is just a click away. We're here to help you succeed.</p>
  `

  return sendEmail(to, `Welcome to ${APP_NAME}!`, wrapEmail('Welcome', content))
}

/**
 * Send an invoice email with payment details
 */
export async function sendInvoiceEmail(
  to: string,
  invoiceData: {
    invoiceId: string
    amount: number
    plan: string
    date: string
    status: string
  }
): Promise<boolean> {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(invoiceData.amount)

  const statusColor = invoiceData.status === 'paid' ? '#059669' : '#dc2626'
  const statusText = invoiceData.status === 'paid' ? '✅ Paid' : '❌ Failed'

  const content = `
    <h2>Invoice ${invoiceData.invoiceId.slice(0, 8).toUpperCase()}</h2>
    <div class="highlight">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Amount Due</td>
          <td style="padding: 8px 0; text-align: right; font-size: 20px; font-weight: 700; color: #0f172a;">${formattedAmount}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Plan</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${invoiceData.plan.charAt(0).toUpperCase() + invoiceData.plan.slice(1)} Plan</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Date</td>
          <td style="padding: 8px 0; text-align: right;">${invoiceData.date}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Status</td>
          <td style="padding: 8px 0; text-align: right; color: ${statusColor}; font-weight: 600;">${statusText}</td>
        </tr>
      </table>
    </div>
    ${invoiceData.status === 'paid'
      ? '<p>Thank you for your payment! Your subscription is active and your workspace resources have been provisioned.</p>'
      : '<p>Your payment attempt was unsuccessful. Please update your payment method to avoid service interruption.</p>'
    }
    <p style="text-align: center;">
      <a href="${APP_URL}/billing" class="btn">View Billing Dashboard</a>
    </p>
  `

  return sendEmail(
    to,
    `${APP_NAME} — Invoice ${invoiceData.status === 'paid' ? 'Receipt' : 'Payment Failed'}`,
    wrapEmail('Invoice', content)
  )
}

/**
 * Verify SMTP connection is working
 */
export async function verifyEmailConnection(): Promise<boolean> {
  const transporter = getTransporter()
  if (!transporter) return false

  try {
    await transporter.verify()
    return true
  } catch {
    return false
  }
}
