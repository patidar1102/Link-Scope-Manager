const ALPHABET =
  "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

// Generates a short, URL-safe random code. Excludes visually ambiguous
// characters (0/O, 1/l/I) to keep codes easy to read and type.
export function generateShortCode(length = 7): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

const VALID_ALIAS_PATTERN = /^[A-Za-z0-9_-]{3,32}$/;

export function isValidCustomAlias(alias: string): boolean {
  return VALID_ALIAS_PATTERN.test(alias);
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
