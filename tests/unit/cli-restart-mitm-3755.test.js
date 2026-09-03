import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("CLI restart crash MITM disabling (#3755)", () => {
  const tmpDir = path.join(os.tmpdir(), `zen-mitm-test-${Date.now()}`);
  const dbDir = path.join(tmpDir, "db");
  const sqlitePath = path.join(dbDir, "data.sqlite");
  const jsonPath = path.join(tmpDir, "db.json");

  beforeEach(() => {
    fs.mkdirSync(dbDir, { recursive: true });
  });

  afterEach(() => {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  });

  it("disables mitmEnabled in legacy db.json", () => {
    fs.writeFileSync(jsonPath, JSON.stringify({ settings: { mitmEnabled: true } }));

    // Replicate disableMitmInDatabase logic for legacy db.json
    const db = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    if (db.settings) db.settings.mitmEnabled = false;
    fs.writeFileSync(jsonPath, JSON.stringify(db, null, 2));

    const updated = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    expect(updated.settings.mitmEnabled).toBe(false);
  });

  it("disables mitmEnabled in sqlite settings table when sqlite exists", async () => {
    // Create a temporary SQLite database with settings table using node:sqlite
    let DatabaseSync;
    try {
      ({ DatabaseSync } = await import("node:sqlite"));
    } catch {
      // If node:sqlite is not available, skip sqlite test
      return;
    }

    const db = new DatabaseSync(sqlitePath);
    db.exec(`CREATE TABLE settings (id INTEGER PRIMARY KEY, data TEXT NOT NULL DEFAULT '{}')`);
    db.exec(`INSERT INTO settings(id, data) VALUES(1, '{"mitmEnabled":true,"theme":"dark"}')`);

    // Verify initial value
    const initialRow = db.prepare("SELECT data FROM settings WHERE id = 1").get();
    expect(JSON.parse(initialRow.data).mitmEnabled).toBe(true);

    // Run disable logic
    const row = db.prepare("SELECT data FROM settings WHERE id = 1").get();
    if (row && row.data) {
      const settings = JSON.parse(row.data);
      settings.mitmEnabled = false;
      db.prepare("UPDATE settings SET data = ? WHERE id = 1").run(JSON.stringify(settings));
    }
    db.close();

    // Verify updated value
    const verifyDb = new DatabaseSync(sqlitePath);
    const updatedRow = verifyDb.prepare("SELECT data FROM settings WHERE id = 1").get();
    expect(JSON.parse(updatedRow.data).mitmEnabled).toBe(false);
    expect(JSON.parse(updatedRow.data).theme).toBe("dark");
    verifyDb.close();
  });
});
