// Lightweight, dependency-free heuristics for classifying human traffic.
// These intentionally trade precision for simplicity/maintainability — good
// enough for analytics dashboards, not meant to be a full UA-parsing library.

export type DeviceType = "mobile" | "tablet" | "desktop" | "other";
export type Browser =
  | "Chrome"
  | "Firefox"
  | "Safari"
  | "Edge"
  | "Opera"
  | "Other";
export type OperatingSystem =
  | "Windows"
  | "macOS"
  | "Linux"
  | "Android"
  | "iOS"
  | "Other";
export type TrafficSource =
  | "Facebook"
  | "Instagram"
  | "Google"
  | "YouTube"
  | "X (Twitter)"
  | "Direct"
  | "Other";

export function detectDevice(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|kindle|playbook|nexus 7|nexus 10/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(ua))
    return "mobile";
  if (/windows nt|macintosh|linux|x11/.test(ua)) return "desktop";
  return "other";
}

export function detectBrowser(userAgent: string): Browser {
  const ua = userAgent;
  // Order matters: Edge/Opera UAs also contain "Chrome" and "Safari" tokens.
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\/|Opera/.test(ua)) return "Opera";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  return "Other";
}

export function detectOS(userAgent: string): OperatingSystem {
  const ua = userAgent;
  if (/Windows NT/.test(ua)) return "Windows";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Other";
}

export function detectTrafficSource(
  referrer: string | undefined | null,
): TrafficSource {
  if (!referrer) return "Direct";
  let host = "";
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "Other";
  }
  if (host.includes("facebook.com") || host.includes("fb.com"))
    return "Facebook";
  if (host.includes("instagram.com")) return "Instagram";
  if (host.includes("youtube.com") || host.includes("youtu.be"))
    return "YouTube";
  if (host.includes("twitter.com") || host.includes("x.com"))
    return "X (Twitter)";
  if (host.includes("google.")) return "Google";
  return "Other";
}
