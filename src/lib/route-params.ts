function toBinary(value: string) {
  return encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
}

function fromBinary(value: string) {
  return decodeURIComponent(
    value
      .split("")
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join(""),
  );
}

function base64Encode(value: string) {
  if (typeof btoa === "function") return btoa(value);

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";

  for (let i = 0; i < value.length; i += 3) {
    const a = value.charCodeAt(i);
    const b = value.charCodeAt(i + 1);
    const c = value.charCodeAt(i + 2);
    const triplet = (a << 16) | ((b || 0) << 8) | (c || 0);

    output += chars[(triplet >> 18) & 63];
    output += chars[(triplet >> 12) & 63];
    output += Number.isNaN(b) ? "=" : chars[(triplet >> 6) & 63];
    output += Number.isNaN(c) ? "=" : chars[triplet & 63];
  }

  return output;
}

function base64Decode(value: string) {
  if (typeof atob === "function") return atob(value);

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let output = "";
  const clean = value.replace(/=+$/, "");

  for (let i = 0; i < clean.length; i += 4) {
    const a = chars.indexOf(clean[i]);
    const b = chars.indexOf(clean[i + 1]);
    const c = chars.indexOf(clean[i + 2]);
    const d = chars.indexOf(clean[i + 3]);
    const triplet = (a << 18) | (b << 12) | ((c & 63) << 6) | (d & 63);

    output += String.fromCharCode((triplet >> 16) & 255);
    if (c !== -1) output += String.fromCharCode((triplet >> 8) & 255);
    if (d !== -1) output += String.fromCharCode(triplet & 255);
  }

  return output;
}

export function encodeRouteValue(value: string) {
  return base64Encode(toBinary(value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeRouteValue(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return "";

  const padded = raw.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (raw.length % 4)) % 4);
  return fromBinary(base64Decode(padded));
}
