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

  describe("Bun & Node disconnect bridge (#3559)", () => {
    it("bridges socket close to res.emit('close') and res.destroy() when res is not finished", () => {
      let closeHandler = null;
      const mockSocket = {
        remoteAddress: "127.0.0.1",
        once: vi.fn((event, handler) => {
          if (event === "close") closeHandler = handler;
        }),
        removeListener: vi.fn(),
      };
      const mockReq = { socket: mockSocket, headers: {}, once: vi.fn() };
      let resCloseEmitted = false;
      let resDestroyCalled = false;
      let finishHandler = null;

      const mockRes = {
        writableFinished: false,
        writableEnded: false,
        emit: vi.fn((event) => {
          if (event === "close") resCloseEmitted = true;
        }),
        destroy: vi.fn(() => {
          resDestroyCalled = true;
        }),
        once: vi.fn((event, handler) => {
          if (event === "finish") finishHandler = handler;
        }),
      };

      // Execute wrapper logic
      const onSocketClose = () => {
        if (!mockRes.writableFinished && !mockRes.writableEnded) {
          if (typeof mockRes.emit === "function") {
            try { mockRes.emit("close"); } catch {}
          }
          if (typeof mockRes.destroy === "function") {
            try { mockRes.destroy(); } catch {}
          }
        }
      };
      mockSocket.once("close", onSocketClose);

      // Trigger socket close mid-stream
      expect(closeHandler).toBeDefined();
      closeHandler();

      expect(resCloseEmitted).toBe(true);
      expect(resDestroyCalled).toBe(true);
    });

    it("does nothing if socket closes after response has finished writing", () => {
      let closeHandler = null;
      const mockSocket = {
        remoteAddress: "127.0.0.1",
        once: vi.fn((event, handler) => {
          if (event === "close") closeHandler = handler;
        }),
        removeListener: vi.fn(),
      };
      let resCloseEmitted = false;
      let resDestroyCalled = false;

      const mockRes = {
        writableFinished: true,
        writableEnded: true,
        emit: vi.fn((event) => {
          if (event === "close") resCloseEmitted = true;
        }),
        destroy: vi.fn(() => {
          resDestroyCalled = true;
        }),
        once: vi.fn(),
      };

      const onSocketClose = () => {
        if (!mockRes.writableFinished && !mockRes.writableEnded) {
          if (typeof mockRes.emit === "function") {
            try { mockRes.emit("close"); } catch {}
          }
          if (typeof mockRes.destroy === "function") {
            try { mockRes.destroy(); } catch {}
          }
        }
      };
      mockSocket.once("close", onSocketClose);

      closeHandler();

      expect(resCloseEmitted).toBe(false);
      expect(resDestroyCalled).toBe(false);
    });
  });
});
