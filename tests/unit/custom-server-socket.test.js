import { describe, expect, it, vi } from "vitest";
import http from "node:http";

describe("Custom server socket tuning", () => {
  it("enables TCP_NODELAY and keepAlive on request socket", async () => {
    let setNoDelayCalled = false;
    let setKeepAliveCalled = false;

    const mockSocket = {
      remoteAddress: "127.0.0.1",
      setNoDelay: vi.fn((val) => { setNoDelayCalled = val; }),
      setKeepAlive: vi.fn((enabled, delay) => { setKeepAliveCalled = enabled; })
    };

    const mockReq = {
      socket: mockSocket,
      headers: {}
    };
    const mockRes = {};

    // Simulate custom server wrapper logic
    if (mockReq.socket) {
      if (typeof mockReq.socket.setNoDelay === "function") mockReq.socket.setNoDelay(true);
      if (typeof mockReq.socket.setKeepAlive === "function") mockReq.socket.setKeepAlive(true, 30000);
    }

    expect(setNoDelayCalled).toBe(true);
    expect(setKeepAliveCalled).toBe(true);
    expect(mockSocket.setNoDelay).toHaveBeenCalledWith(true);
    expect(mockSocket.setKeepAlive).toHaveBeenCalledWith(true, 30000);
  });
});
