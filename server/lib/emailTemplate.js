// Branded HTML template for transactional emails.
// Inline CSS only — Gmail strips <style> blocks. Table-based layout for
// Outlook/legacy client compatibility.

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));

function renderEmail({ title, bodyHtml, buttonText, buttonUrl, footerNote }) {
  const safeTitle = esc(title);
  const safeButtonText = esc(buttonText);
  const safeButtonUrl = esc(buttonUrl);
  const safeFooterNote = esc(footerNote);

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#fdfcf8;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fdfcf8;">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;">
        <tr>
          <td align="center" style="padding:32px 32px 24px 32px;">
            <img src="https://app.sherlock.school/brand/sherlock-logo.png" alt="Sherlock" width="80" style="display:block;max-width:80px;height:auto;border:0;">
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 32px 16px 32px;">
            <h1 style="margin:0;font-family:'Arbutus Slab',Georgia,serif;font-size:24px;font-weight:400;color:#111827;line-height:1.3;">${safeTitle}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 24px 32px;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;color:#111827;line-height:1.6;">${bodyHtml}</td>
        </tr>
        <tr>
          <td align="center" style="padding:0 32px 24px 32px;">
            <a href="${safeButtonUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;font-weight:500;">${safeButtonText}</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 32px 32px 32px;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;color:#6b7280;line-height:1.5;">${safeFooterNote}</td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%;margin-top:24px;">
        <tr>
          <td align="center" style="font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#6b7280;">Sherlock Is Smart</td>
        </tr>
        <tr>
          <td align="center" style="font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#6b7280;padding-top:4px;">© 2026 Sherlock Is Smart</td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

module.exports = { renderEmail, esc };
