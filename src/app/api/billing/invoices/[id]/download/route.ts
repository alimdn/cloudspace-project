import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { unauthorizedResponse, errorResponse, notFoundResponse } from '@/lib/api-response'

/**
 * GET /api/billing/invoices/[id]/download
 * Generates a real PDF-like invoice as an HTML file for download
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    const { id } = await params

    // Fetch invoice from DB
    const invoice = await db.invoice.findFirst({
      where: { id, userId: authUser.userId },
    })

    if (!invoice) {
      return notFoundResponse('Invoice not found')
    }

    // Fetch user info
    const user = await db.user.findUnique({
      where: { id: authUser.userId },
      select: { name: true, email: true },
    })

    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(invoice.amount)

    const formattedDate = invoice.date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const statusBadge = invoice.status === 'paid'
      ? '<span style="background: #059669; color: white; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 600;">PAID</span>'
      : '<span style="background: #dc2626; color: white; padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 600;">FAILED</span>'

    // Generate HTML invoice
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.id.slice(0, 8).toUpperCase()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; }
    .page { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; }
    .company { }
    .company h1 { font-size: 28px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
    .company p { color: #64748b; font-size: 14px; }
    .invoice-badge { text-align: right; }
    .invoice-badge .label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px; }
    .invoice-badge .number { font-size: 20px; font-weight: 700; color: #0f172a; }
    .meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px; margin-bottom: 40px; }
    .meta-item .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 4px; }
    .meta-item .value { font-size: 15px; font-weight: 600; color: #0f172a; }
    .divider { height: 2px; background: #e2e8f0; margin: 32px 0; }
    .billing-info { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
    .billing-section h3 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 8px; }
    .billing-section .name { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
    .billing-section .detail { font-size: 14px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    thead th { background: #0f172a; color: white; padding: 14px 20px; text-align: left; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; }
    thead th:last-child { text-align: right; }
    tbody td { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; font-size: 15px; }
    tbody td:last-child { text-align: right; font-weight: 600; }
    .total-row { background: #f1f5f9; }
    .total-row td { font-size: 18px; font-weight: 700; color: #0f172a; border-bottom: none; }
    .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 13px; }
    @media print { body { background: white; } .page { padding: 20px; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="company">
        <h1>☁️ CloudSpace</h1>
        <p>Cloud Development Platform</p>
        <p>billing@cloudspace.app</p>
      </div>
      <div class="invoice-badge">
        <div class="label">Invoice</div>
        <div class="number">#${invoice.id.slice(0, 8).toUpperCase()}</div>
        <div style="margin-top: 12px;">${statusBadge}</div>
      </div>
    </div>

    <div class="meta">
      <div class="meta-item">
        <div class="label">Invoice Date</div>
        <div class="value">${formattedDate}</div>
      </div>
      <div class="meta-item">
        <div class="label">Plan</div>
        <div class="value">${invoice.plan} Plan</div>
      </div>
      <div class="meta-item">
        <div class="label">Billing Period</div>
        <div class="value">Monthly</div>
      </div>
    </div>

    <div class="billing-info">
      <div class="billing-section">
        <h3>Billed To</h3>
        <div class="name">${user?.name || 'Customer'}</div>
        <div class="detail">${user?.email || ''}</div>
      </div>
      <div class="billing-section">
        <h3>Payment Method</h3>
        <div class="detail">Card ending in ****</div>
        <div class="detail">Automatic payment</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Period</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${invoice.plan} Plan — Monthly Subscription</td>
          <td>${formattedDate}</td>
          <td>${formattedAmount}</td>
        </tr>
        <tr class="total-row">
          <td colspan="2" style="text-align: right;">Total</td>
          <td>${formattedAmount}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <p>Thank you for using CloudSpace! If you have questions about this invoice, please contact support.</p>
      <p style="margin-top: 8px;">© ${new Date().getFullYear()} CloudSpace. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="invoice-${invoice.id.slice(0, 8).toUpperCase()}.html"`,
      },
    })
  } catch (error) {
    console.error('[Invoice Download] Error:', error)
    return errorResponse('Failed to download invoice', 500)
  }
}
