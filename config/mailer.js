const nodemailer = require('nodemailer');

const host = process.env.SMTP_HOST;
const port = parseInt(process.env.SMTP_PORT || '587', 10);
const rawSecure = process.env.SMTP_SECURE;
const requireTLS = process.env.SMTP_REQUIRE_TLS === 'true';

// If SMTP_SECURE is not explicitly provided, infer from port (465 => true, else false)
const secure = rawSecure === 'true' ? true : rawSecure === 'false' ? false : String(port) === '465';

if (secure && port === 587) {
  console.warn('[MAILER] SMTP_SECURE=true with port 587 (STARTTLS). Consider setting SMTP_SECURE=false or use port 465.');
}

const transport = nodemailer.createTransport({
  host,
  port,
  secure,
  requireTLS,
  auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined,
  tls: {
    minVersion: 'TLSv1.2',
    servername: host
  }
});

async function verifyTransport() {
  try {
    await transport.verify();
    console.log('[MAILER] SMTP transport verified');
  } catch (err) {
    console.warn('[MAILER] SMTP verify failed:', err.message);
  }
}

function fromAddress() {
  const name = process.env.MAIL_FROM_NAME || (process.env.APP_NAME || 'Glacier');
  const email = process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';
  return `${name} <${email}>`;
}

async function sendEmail(options) {
  const mail = {
    from: fromAddress(),
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  };
  return transport.sendMail(mail);
}

/**
 * Sends an email using a pre-rendered template object { html, text }.
 */
async function sendTemplatedEmail({ to, subject, template }) {
  return sendEmail({ to, subject, text: template.text, html: template.html });
}

module.exports = {
  transport,
  sendEmail,
  sendTemplatedEmail,
  verifyTransport
};


