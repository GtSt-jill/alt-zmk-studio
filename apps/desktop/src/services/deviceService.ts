import { TauriZmkDeviceTransport } from "@alt-zmk-studio/tauri-transport";
import type { ZmkDeviceTransport } from "@alt-zmk-studio/transport";

let transport: ZmkDeviceTransport = new TauriZmkDeviceTransport();

export function getDeviceTransport(): ZmkDeviceTransport {
  return transport;
}

export function setDeviceTransport(nextTransport: ZmkDeviceTransport): void {
  transport = nextTransport;
}
