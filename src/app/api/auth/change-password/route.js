import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/localDb";
import bcrypt from "bcryptjs";
import { hasValidCliToken, hasValidToken } from "@/dashboardGuard";

export async function POST(request) {
  try {
    const hasJwt = await hasValidToken(request);
    const hasCli = await hasValidCliToken(request);
    if (!hasJwt && !hasCli) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json().catch(() => ({}));
    if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json({ error: "New password is required (minimum 6 characters)" }, { status: 400 });
    }

    const settings = await getSettings();
    const currentHash = settings.password;

    if (currentHash) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password required" }, { status: 400 });
      }
      const isValid = await bcrypt.compare(currentPassword, currentHash);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
      }
    } else {
      // First time setting password
      if (currentPassword && currentPassword !== "12345678" && currentPassword !== "123456") {
        return NextResponse.json({ error: "Invalid current password" }, { status: 401 });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await updateSettings({ password: hashedPassword });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Failed to update password" }, { status: 500 });
  }
}
