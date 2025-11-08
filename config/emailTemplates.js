const appName = process.env.APP_NAME || 'Glacier';
const appUrl = process.env.CLIENT_URL || 'http://localhost:5173';

function inlineText(html) {
  return html
    .replace(/<\/?(strong|b)>/g, '*')
    .replace(/<br\s*\/?>(\n)?/gi, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/<a [^>]*href=\"([^\"]+)\"[^>]*>(.*?)<\/a>/gi, '$2 ($1)')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function baseTemplate({ title, preheader, bodyHtml, footerHtml, accentColor }) {
  const color = accentColor || '#2563eb';
  const safePreheader = preheader || '';
  const year = new Date().getFullYear();
  const html = `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${title || appName}</title>
    <style>
      /* Basic reset */
      body { background-color: #f6f9fc; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 24px 16px; }
      .card { background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
      .header { padding: 20px 24px; background: ${color}; color: #ffffff; }
      .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
      .content { padding: 24px; color: #0f172a; line-height: 1.6; }
      .content h2 { margin-top: 0; font-size: 18px; }
      .btn { display: inline-block; padding: 10px 16px; border-radius: 8px; background: ${color}; color: #ffffff !important; text-decoration: none; font-weight: 600; }
      .muted { color: #64748b; }
      .footer { padding: 16px 24px; color: #64748b; font-size: 12px; background: #f8fafc; }
      @media (max-width: 600px) {
        .content { padding: 20px; }
        .header, .footer { padding: 16px; }
      }
    </style>
  </head>
  <body>
    <span style="display:none!important;opacity:0;color:transparent;max-height:0;max-width:0;overflow:hidden">${safePreheader}</span>
    <div class="container">
      <div class="card">
        <div class="header">
          <h1>${title || appName}</h1>
        </div>
        <div class="content">
          ${bodyHtml}
        </div>
        <div class="footer">
          <div class="muted">© ${year} ${appName}. All rights reserved.</div>
        </div>
      </div>
      ${footerHtml || ''}
    </div>
  </body>
</html>`;

  return { html, text: inlineText(bodyHtml) };
}

function cta({ href, label }) {
  return `<a class="btn" href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}

function welcomeTemplate({ userName, dashboardUrl }) {
  const body = `
    <h2>Welcome, ${userName || 'there'} 👋</h2>
    <p>We’re excited to have you on ${appName}. Here are a few things you can do next:</p>
    <ol>
      <li>Create your first team</li>
      <li>Invite your teammates</li>
      <li>Start tracking tasks</li>
    </ol>
    <p>${cta({ href: dashboardUrl || appUrl, label: 'Open Dashboard' })}</p>
    <p class="muted">If the button doesn’t work, copy and paste this URL into your browser: ${dashboardUrl || appUrl}</p>
  `;
  return baseTemplate({
    title: `Welcome to ${appName}`,
    preheader: `Let’s get you set up on ${appName}`,
    bodyHtml: body
  });
}

function passwordResetTemplate({ resetUrl }) {
  const body = `
    <h2>Reset your password</h2>
    <p>We received a request to reset your password. Click the button below to continue.</p>
    <p>${cta({ href: resetUrl, label: 'Reset Password' })}</p>
    <p class="muted">If you didn’t request this, you can ignore this email.</p>
    <p class="muted">If the button doesn’t work, copy and paste this URL: ${resetUrl}</p>
  `;
  return baseTemplate({
    title: `${appName} — Password Reset`,
    preheader: 'Password reset link inside',
    bodyHtml: body
  });
}

function teamInviteTemplate({ inviterName, teamName, acceptUrl }) {
  const body = `
    <h2>Team invitation</h2>
    <p><strong>${inviterName}</strong> invited you to join <strong>${teamName || 'a team'}</strong> on ${appName}.</p>
    <p>${cta({ href: acceptUrl, label: 'Accept Invitation' })}</p>
    <p class="muted">If the button doesn’t work, copy and paste this URL: ${acceptUrl}</p>
  `;
  return baseTemplate({
    title: `${appName} — Team Invitation`,
    preheader: `${inviterName} invited you to a team`,
    bodyHtml: body
  });
}

function taskAssignedTemplate({ creatorName, title, openUrl }) {
  const body = `
    <h2>New task assigned</h2>
    <p><strong>${creatorName}</strong> assigned you a task:</p>
    <p><strong>${title}</strong></p>
    ${openUrl ? `<p>${cta({ href: openUrl, label: 'View Task' })}</p>` : ''}
  `;
  return baseTemplate({
    title: `${appName} — Task Assigned`,
    preheader: `${creatorName} assigned you a task`,
    bodyHtml: body
  });
}

function digestTemplate({ period, items }) {
  const list = (items || []).map(t => `<li>${t.title} (${t.status}, ${t.priority})</li>`).join('');
  const body = `
    <h2>${appName} ${period} Digest</h2>
    <p>Recent activity:</p>
    <ul>${list}</ul>
  `;
  return baseTemplate({
    title: `${appName} — ${period} Digest`,
    preheader: `Your ${period.toLowerCase()} summary`,
    bodyHtml: body
  });
}

module.exports = {
  baseTemplate,
  welcomeTemplate,
  passwordResetTemplate,
  teamInviteTemplate,
  taskAssignedTemplate,
  digestTemplate
};







