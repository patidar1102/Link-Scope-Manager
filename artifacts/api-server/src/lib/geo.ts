import geoip from "geoip-lite";

// Resolves a country/city from an IP address using an offline database (no
// external API calls, no key required). The IP itself is used transiently
// here and discarded — only the resolved country/city are ever persisted.
export function lookupGeo(ip: string): { country: string | null; city: string | null } {
  try {
    const result = geoip.lookup(ip);
    if (!result) return { country: null, city: null };
    return {
      country: result.country ?? null,
      city: result.city || null,
    };
  } catch {
    return { country: null, city: null };
  }
}
