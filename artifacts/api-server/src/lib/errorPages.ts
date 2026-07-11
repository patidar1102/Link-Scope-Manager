// Small, dependency-free HTML templates for the redirect endpoints' error
// states. Kept intentionally simple/self-contained since they're served
// outside the React app.
function page(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title} · LinkScope</title>
<style>
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg,#eef2ff 0%,#f5f3ff 100%); color:#1e1b4b; }
  .card { max-width: 420px; margin: 24px; padding: 40px 32px; background:#fff; border-radius:20px;
    box-shadow: 0 20px 60px -20px rgba(76,29,149,0.25); text-align:center; }
  h1 { font-size: 22px; margin: 0 0 12px; }
  p { font-size: 15px; color:#5b21b6; line-height:1.5; margin:0; }
  .badge { display:inline-flex; width:56px; height:56px; border-radius:16px;
    background: linear-gradient(135deg,#6366f1,#8b5cf6); margin-bottom:20px; }
</style>
</head>
<body>
  <div class="card">
    <div class="badge"></div>
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

export function notFoundPage(): string {
  return page("Link not found", "This short link doesn't exist. Double-check the URL and try again.");
}

export function disabledPage(): string {
  return page("Link disabled", "This short link has been disabled by its owner.");
}

export function expiredPage(): string {
  return page("Link expired", "This short link is no longer active.");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Rendered for bot/crawler traffic (never redirected — HTTP 200 with full
// OG/Twitter meta tags so link previews render correctly, no cloaking).
export function socialPreviewPage(params: {
  title: string;
  description: string;
  imageUrl: string | null;
  destinationUrl: string;
  shortUrl: string;
}): string {
  const title = escapeHtml(params.title);
  const description = escapeHtml(params.description);
  const image = params.imageUrl ? escapeHtml(params.imageUrl) : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${title}</title>
<meta name="description" content="${description}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${escapeHtml(params.shortUrl)}" />
${image ? `<meta property="og:image" content="${image}" />` : ""}
<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${description}" />
${image ? `<meta name="twitter:image" content="${image}" />` : ""}
<meta http-equiv="refresh" content="0; url=${escapeHtml(params.destinationUrl)}" />
</head>
<body>
  <p>${title}</p>
  <p><a href="${escapeHtml(params.destinationUrl)}">${escapeHtml(params.destinationUrl)}</a></p>
</body>
</html>`;
}
