const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";
const authDisabled = process.env.NEXT_PUBLIC_DISABLE_AUTH === "true";

if (authDisabled) {
  throw new Error(
    "NEXT_PUBLIC_DISABLE_AUTH must remain false for staging. Use NEXT_PUBLIC_USE_MOCK=true for UI-only testing.",
  );
}

if (useMock) {
  console.log("Staging check: isolated browser mock mode enabled.");
  process.exit(0);
}

const backendUrl = process.env.BACKEND_URL;
if (!backendUrl) {
  throw new Error(
    "BACKEND_URL is required for staging API mode. Point it to the dedicated staging backend.",
  );
}

let parsed;
try {
  parsed = new URL(backendUrl);
} catch {
  throw new Error("BACKEND_URL must be an absolute http(s) URL.");
}

if (!['http:', 'https:'].includes(parsed.protocol)) {
  throw new Error("BACKEND_URL must use http or https.");
}

const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
const isLocal = localHosts.has(parsed.hostname);
if (!isLocal && parsed.protocol !== "https:") {
  throw new Error("A remote staging backend must use HTTPS.");
}

if (!isLocal && !parsed.hostname.toLowerCase().includes("staging")) {
  throw new Error(
    "Refusing a remote BACKEND_URL whose hostname does not contain 'staging'.",
  );
}

if (backendUrl !== parsed.origin) {
  throw new Error("BACKEND_URL must contain only the origin, with no path or trailing slash.");
}

console.log(`Staging check: API mode will use ${parsed.origin}.`);
