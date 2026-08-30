// SSRF guard: block internal/private/metadata targets for server-side fetch.
import dns from "dns/promises";

const BLOCKED_HOSTNAMES = new Set(["localhost", "ip6-localhost", "ip6-loopback"]);
const BLOCKED_SUFFIXES = [".internal", ".local", ".localhost"];
// DNS rebinding services that resolve to private IPs (CWE-918)
const BLOCKED_DNS_REBINDING_SUFFIXES = [".nip.io", ".sslip.io", ".xip.io"];
const BLOCKED_DNS_REBINDING_HOSTS = new Set(["localtest.me"]);

// Parse dotted IPv4 to 32-bit integer, or null if not a valid IPv4 literal.
function ipv4ToInt(host) {
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = value * 256 + octet;
  }
  return value >>> 0;
}

// Parse alternative numeric IPv4 encodings (CWE-918): decimal, octal, hex.
// Examples: 2130706433 (decimal), 0x7f000001 (hex), 0177.0.0.1 (octal), 0x7f.0.0.1 (mixed)
function parseOctetVariant(part) {
  if (/^0x[0-9a-f]+$/i.test(part)) return parseInt(part, 16);
  if (/^0[0-7]+$/.test(part) && part.length > 1) return parseInt(part, 8);
  if (/^\d+$/.test(part)) return Number(part);
  return NaN;
}

function parseAlternativeIpv4(host) {
  // Pure 32-bit decimal: 2130706433 -> 127.0.0.1
  if (/^\d+$/.test(host)) {
    const n = Number(host);
    if (n >= 0 && n <= 0xffffffff) {
      return n >>> 0;
    }
    return null;
  }
  // Pure hex 32-bit: 0x7f000001
  if (/^0x[0-9a-f]+$/i.test(host)) {
    const n = parseInt(host, 16);
    if (n >= 0 && n <= 0xffffffff) return n >>> 0;
    return null;
  }
  // Dotted variants with hex/octal octets
  if (host.includes(".")) {
    const parts = host.split(".");
    if (parts.length !== 4) return null;
    let value = 0;
    for (const part of parts) {
      const octet = parseOctetVariant(part);
      if (!Number.isFinite(octet) || octet < 0 || octet > 255) return null;
      value = value * 256 + octet;
    }
    return value >>> 0;
  }
  return null;
}

function isBlockedAlternativeIpv4(host) {
  const ip = parseAlternativeIpv4(host);
  if (ip === null) return false;
  return BLOCKED_V4_RANGES.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (ip & mask) === (base & mask);
  });
}

// Private/reserved IPv4 ranges as [startInt, maskBits].
const BLOCKED_V4_RANGES = [
  [ipv4ToInt("0.0.0.0"), 8],       // Current network (RFC 1122)
  [ipv4ToInt("10.0.0.0"), 8],      // Private network (RFC 1918)
  [ipv4ToInt("100.64.0.0"), 10],   // Shared Address Space / CGNAT (RFC 6598)
  [ipv4ToInt("127.0.0.0"), 8],     // Loopback (RFC 1122)
  [ipv4ToInt("169.254.0.0"), 16],  // Link-local / Cloud Metadata (RFC 3927)
  [ipv4ToInt("172.16.0.0"), 12],   // Private network (RFC 1918)
  [ipv4ToInt("192.0.0.0"), 24],    // IETF Protocol Assignments (RFC 6890)
  [ipv4ToInt("192.0.2.0"), 24],    // Documentation TEST-NET-1 (RFC 5737)
  [ipv4ToInt("192.168.0.0"), 16],  // Private network (RFC 1918)
  [ipv4ToInt("198.18.0.0"), 15],   // Benchmarking (RFC 2544)
  [ipv4ToInt("198.51.100.0"), 24], // Documentation TEST-NET-2 (RFC 5737)
  [ipv4ToInt("203.0.113.0"), 24],  // Documentation TEST-NET-3 (RFC 5737)
  [ipv4ToInt("224.0.0.0"), 4],     // Multicast (RFC 5771)
  [ipv4ToInt("240.0.0.0"), 4],     // Reserved for Future Use (RFC 1112)
];

export function isBlockedIpv4(host) {
  const ip = ipv4ToInt(host);
  if (ip === null) return false;
  return BLOCKED_V4_RANGES.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return (ip & mask) === (base & mask);
  });
}

export function isBlockedIpv6(host) {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  // IPv4-mapped: ::ffff:127.0.0.1 + hex variants ::ffff:7f00:1
  const v4Mapped = h.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (v4Mapped) return isBlockedIpv4(v4Mapped[1]) || isBlockedAlternativeIpv4(v4Mapped[1]);
  const hexMapped = h.match(/^::ffff:([0-9a-f]+:[0-9a-f]+)$/i);
  if (hexMapped) {
    // 7f00:1 -> 127.0.0.1 check via hex octets
    const parts = hexMapped[1].split(":");
    const hi = parseInt(parts[0], 16);
    const lo = parseInt(parts[1], 16);
    const ip = ((hi >>> 0) * 65536 + lo) >>> 0;
    // Compare as IPv4 int
    return BLOCKED_V4_RANGES.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
      return (ip & mask) === (base & mask);
    });
  }
  if (h === "::1" || h === "::") return true;
  // fec0::/10 Site-local (deprecated but still routable in some stacks)
  if (h.startsWith("fec") || h.startsWith("fed") || h.startsWith("fee") || h.startsWith("fef")) return true;
  return (
    h.startsWith("fe80:") || // Link-local unicast (RFC 4291)
    h.startsWith("fc") ||    // Unique local address (RFC 4193)
    h.startsWith("fd") ||    // Unique local address (RFC 4193)
    h.startsWith("ff")       // Multicast
  );
}

export function assertPublicIp(ip) {
  if (isBlockedIpv4(ip)) throw new Error("Blocked URL: private IP");
  if (isBlockedIpv6(ip)) throw new Error("Blocked URL: private IP");
}

// Fast synchronous validation: protocol, blocked hostnames, and IP literals.
export function assertPublicUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Blocked URL: unsupported protocol ${parsed.protocol}`);
  }
  const host = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(host)) throw new Error("Blocked URL: internal host");
  if (BLOCKED_DNS_REBINDING_HOSTS.has(host)) throw new Error("Blocked URL: private IP (DNS rebinding host)");
  if (BLOCKED_SUFFIXES.some((s) => host.endsWith(s))) throw new Error("Blocked URL: internal host");
  if (BLOCKED_DNS_REBINDING_SUFFIXES.some((s) => host.endsWith(s))) throw new Error("Blocked URL: private IP (DNS rebinding host)");
  if (isBlockedIpv4(host)) throw new Error("Blocked URL: private IP");
  if (isBlockedAlternativeIpv4(host)) throw new Error("Blocked URL: private IP (alt encoding)");
  if (host.includes(":") && isBlockedIpv6(host)) throw new Error("Blocked URL: private IP");
}

// Full asynchronous validation with DNS lookup resolution to prevent DNS rebinding.
export function assertPublicUrlAsync(rawUrl) {
  try {
    assertPublicUrl(rawUrl);
  } catch (e) {
    return Promise.reject(e);
  }
  const parsed = new URL(rawUrl);
  const host = parsed.hostname.toLowerCase();

  // If host is already an IPv4 or IPv6 literal (incl. alt encodings), sync assert is sufficient
  if (ipv4ToInt(host) !== null || isBlockedAlternativeIpv4(host) || (host.includes(":") && isBlockedIpv6(host))) {
    return Promise.resolve();
  }

  return dns.lookup(host, { all: true, verbatim: true }).then((records) => {
    if (!records || records.length === 0) return;
    for (const record of records) {
      if (record.family === 4 && isBlockedIpv4(record.address)) {
        throw new Error("Blocked URL: private IP via DNS resolution");
      }
      if (record.family === 6 && isBlockedIpv6(record.address)) {
        throw new Error("Blocked URL: private IP via DNS resolution");
      }
    }
  }).catch((err) => {
    // Re-throw our explicit blocked errors
    if (err.message?.startsWith("Blocked URL:")) throw err;
    // For DNS lookup errors (e.g. ENOTFOUND), do not block here so normal fetch handles network failure
  });
}
