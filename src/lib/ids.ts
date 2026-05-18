const prefixes = {
  message: "msg",
  part: "prt",
} as const;

let lastTimestamp = 0;
let counter = 0;

function randomBase62(length: number) {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const bytes = new Uint8Array(length);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }

  return Array.from(bytes, (byte) => chars[byte % chars.length]).join("");
}

export function createAscendingId(prefix: keyof typeof prefixes) {
  const timestamp = Date.now();
  if (timestamp !== lastTimestamp) {
    lastTimestamp = timestamp;
    counter = 0;
  }

  counter += 1;
  const sortable = Math.floor(timestamp * 0x1000 + counter)
    .toString(16)
    .padStart(12, "0")
    .slice(-12);

  return `${prefixes[prefix]}_${sortable}${randomBase62(14)}`;
}
