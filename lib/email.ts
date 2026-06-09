import https from 'node:https'

function getAppUrl(): string {
  return process.env.APP_URL ?? 'http://localhost:3000'
}

/** Send a JSON request via Node's native https — bypasses Next.js's patched fetch. */
function httpsPost(url: string, body: object, headers: Record<string, string>): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body)
    const { hostname, pathname, search } = new URL(url)
    const req = https.request(
      { hostname, path: pathname + search, method: 'POST', headers: { ...headers, 'Content-Length': Buffer.byteLength(payload) }, rejectUnauthorized: false },
      (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body: data }))
      }
    )
    req.on('error', reject)
    req.write(payload)
    req.end()
  })
}

export async function sendPasswordResetEmail(toEmail: string, rawToken: string): Promise<void> {
  const resetUrl = `${getAppUrl()}/reset-password?token=${rawToken}`

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    // Dev fallback — log the link instead of sending
    console.log(`[password-reset] Reset link for ${toEmail}: ${resetUrl}`)
    return
  }

  const { status, body } = await httpsPost(
    'https://api.resend.com/emails',
    {
      from: process.env.EMAIL_FROM ?? 'NetworkMe <noreply@networkme.app>',
      to: toEmail,
      subject: 'Reset your NetworkMe password',
      html: `
        <p>Hi,</p>
        <p>You requested a password reset for your NetworkMe account.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background:#4f46e5;color:#fff;border-radius:6px;text-decoration:none;">
            Reset password
          </a>
        </p>
        <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      `,
    },
    {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
  )

  if (status < 200 || status >= 300) {
    console.error('[resend]', status, body)
    throw new Error(`Resend error ${status}: ${body}`)
  }
}
