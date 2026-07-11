// Classifies an incoming User-Agent into a bot type, or "human" if none
// match. Order matters — more specific patterns must be checked first
// (e.g. Facebook's crawler UA also contains generic bot-like tokens).
export type BotClassification =
  | "facebook_meta_crawler"
  | "social_preview_bot"
  | "search_engine_bot"
  | "suspicious_bot"
  | "unknown_bot"
  | "human";

const FACEBOOK_META_PATTERNS = [
  /facebookexternalhit/i,
  /facebookcatalog/i,
  /Facebot/i,
  /meta-externalagent/i,
];

const SOCIAL_PREVIEW_PATTERNS = [
  /Twitterbot/i,
  /LinkedInBot/i,
  /Slackbot/i,
  /WhatsApp/i,
  /TelegramBot/i,
  /Discordbot/i,
  /Pinterest/i,
  /redditbot/i,
  /SkypeUriPreview/i,
  /Snapchat/i,
  /iMessageLinkPreview/i,
  /Viber/i,
];

const SEARCH_ENGINE_PATTERNS = [
  /Googlebot/i,
  /bingbot/i,
  /Slurp/i, // Yahoo
  /DuckDuckBot/i,
  /Baiduspider/i,
  /YandexBot/i,
  /Applebot/i,
  /Sogou/i,
  /Exabot/i,
];

// Known scrapers / SEO tools / uptime monitors that are not malicious but are
// not search engines or social previews either — worth flagging separately.
const SUSPICIOUS_PATTERNS = [
  /AhrefsBot/i,
  /SemrushBot/i,
  /MJ12bot/i,
  /DotBot/i,
  /python-requests/i,
  /curl\//i,
  /wget/i,
  /scrapy/i,
  /HeadlessChrome/i,
  /PhantomJS/i,
  /^Go-http-client/i,
  /libwww-perl/i,
  /okhttp/i,
];

// Generic bot signals that don't match a known category but still identify
// themselves as automated.
const GENERIC_BOT_PATTERNS = [/bot/i, /spider/i, /crawler/i, /crawl/i];

export function classifyUserAgent(
  userAgent: string | undefined | null,
): BotClassification {
  const ua = (userAgent ?? "").trim();

  if (!ua) {
    // No UA at all is unusual for a real browser — treat as unknown bot
    // rather than human to avoid crediting a fake click.
    return "unknown_bot";
  }

  if (FACEBOOK_META_PATTERNS.some((p) => p.test(ua))) {
    return "facebook_meta_crawler";
  }
  if (SOCIAL_PREVIEW_PATTERNS.some((p) => p.test(ua))) {
    return "social_preview_bot";
  }
  if (SEARCH_ENGINE_PATTERNS.some((p) => p.test(ua))) {
    return "search_engine_bot";
  }
  if (SUSPICIOUS_PATTERNS.some((p) => p.test(ua))) {
    return "suspicious_bot";
  }
  if (GENERIC_BOT_PATTERNS.some((p) => p.test(ua))) {
    return "unknown_bot";
  }
  return "human";
}

export function isBot(classification: BotClassification): boolean {
  return classification !== "human";
}

export const BOT_LABELS: Record<BotClassification, string> = {
  facebook_meta_crawler: "Facebook / Meta Crawler",
  social_preview_bot: "Social Preview Bot",
  search_engine_bot: "Search Engine Bot",
  suspicious_bot: "Suspicious Bot",
  unknown_bot: "Unknown Bot",
  human: "Human",
};
