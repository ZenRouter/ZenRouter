import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { generateKeyPairSync } from "node:crypto";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const forge = require("node-forge");
const execute = promisify(execFile);
const runner = fileURLToPath(new URL("../helpers/mitm-upstream-tls.cjs", import.meta.url));
let directory;

beforeAll(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "zenrouter-upstream-tls-"));
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  const signingKey = forge.pki.privateKeyFromPem(privateKey);
  const issuer = [{ name: "commonName", value: "Synthetic upstream test CA" }];
  function certificate(host, ca, serial) {
    const cert = forge.pki.createCertificate();
    cert.publicKey = forge.pki.publicKeyFromPem(publicKey);
    cert.serialNumber = serial;
    cert.validity.notBefore = new Date("2020-01-01T00:00:00Z");
    cert.validity.notAfter = new Date("2040-01-01T00:00:00Z");
    cert.setSubject(ca ? issuer : [{ name: "commonName", value: host }]);
    cert.setIssuer(issuer);
    cert.setExtensions(ca ? [
      { name: "basicConstraints", cA: true, critical: true },
      { name: "keyUsage", keyCertSign: true, cRLSign: true, critical: true },
    ] : [
      { name: "basicConstraints", cA: false },
      { name: "keyUsage", digitalSignature: true, keyEncipherment: true },
      { name: "extKeyUsage", serverAuth: true },
      { name: "subjectAltName", altNames: [{ type: 2, value: host }] },
    ]);
    cert.sign(signingKey, forge.md.sha256.create());
    return forge.pki.certificateToPem(cert);
  }
  const ca = certificate(null, true, "01");
  fs.writeFileSync(path.join(directory, "ca.crt"), ca);
  fs.writeFileSync(path.join(directory, "leaf.key"), privateKey);
  fs.writeFileSync(path.join(directory, "leaf.crt"), certificate("upstream.test", false, "02"));
  fs.writeFileSync(path.join(directory, "wrong.crt"), certificate("other.test", false, "03"));
  // The inbound interception trust deliberately matches the synthetic upstream
  // CA. Merely loading it as the server's CA must NOT trust outbound traffic.
  fs.writeFileSync(path.join(directory, "rootCA.key"), privateKey);
  fs.writeFileSync(path.join(directory, "rootCA.crt"), ca);
});

afterAll(() => fs.rmSync(directory, { recursive: true, force: true }));

async function forward(protocol, scenario, trust) {
  const env = {};
  for (const name of ["SystemRoot", "TEMP", "TMP"]) {
    if (process.env[name]) env[name] = process.env[name];
  }
  if (trust) env.NODE_EXTRA_CA_CERTS = path.join(directory, "ca.crt");
  const { stdout } = await execute(process.execPath, [runner, directory, protocol, scenario], { env, timeout: 15000 });
  return JSON.parse(stdout);
}

for (const protocol of ["http/1.1", "h2"]) {
  describe(`MITM native ${protocol} upstream trust`, () => {
    it("rejects an untrusted upstream before forwarding credentials or body, without protocol retry", async () => {
      const result = await forward(protocol, "untrusted", false);
      expect(result.first).toMatchObject({ status: 502, body: "Bad Gateway" });
      expect(result.received).toEqual([]);
      expect(result.destinationConnections).toBe(1);
      expect(result.logs.join("\n")).not.toContain("synthetic-query-secret");
      expect(result.logs.join("\n")).not.toContain("synthetic-credential");
    });

    it("accepts operator NODE_EXTRA_CA_CERTS trust while preserving SNI, credentials, body and negotiated protocol", async () => {
      const result = await forward(protocol, "trusted", true);
      expect(result.first).toMatchObject({ status: 201, body: "upstream response", headers: { "x-upstream": "verified" } });
      expect(result.received).toEqual([expect.objectContaining({
        protocol: protocol === "h2" ? "2.0" : "1.1",
        servername: "upstream.test", body: "synthetic-private-body",
        path: "/forward?token=synthetic-query-secret",
        headers: expect.objectContaining({ authorization: "Bearer synthetic-credential" }),
      })]);
    });

    it("rejects a trusted CA certificate for the wrong hostname before forwarding", async () => {
      const result = await forward(protocol, "hostname-mismatch", true);
      expect(result.first).toMatchObject({ status: 502, body: "Bad Gateway" });
      expect(result.received).toEqual([]);
      expect(result.destinationConnections).toBe(1);
    });

    it("validates the actual forwarding connection even after successful ALPN is cached", async () => {
      const result = await forward(protocol, "changed-certificate", true);
      expect(result.first.status).toBe(201);
      expect(result.second.status).toBe(502);
      expect(result.received).toEqual([expect.objectContaining({ body: "synthetic-private-body" })]);
      expect(result.logs.join("\n")).not.toContain("synthetic-query-secret");
    });
  });
}
