import type {
  DeviceInfo,
  KeyBinding,
  KeyboardLayout,
  KeyPosition,
  Layer,
  LayerId
} from "@alt-zmk-studio/core";

export type SerialDevice = {
  id: string;
  path: string;
  displayName: string;
  manufacturer?: string;
  product?: string;
  vendorId?: number;
  productId?: number;
};

export type TransportErrorCode =
  | "notConnected"
  | "permissionDenied"
  | "timeout"
  | "unsupported"
  | "deviceError"
  | "unknown";

export class TransportError extends Error {
  readonly code: TransportErrorCode;

  constructor(code: TransportErrorCode, message: string) {
    super(message);
    this.name = "TransportError";
    this.code = code;
  }
}

export type ZmkDeviceTransport = {
  listSerialDevices(): Promise<readonly SerialDevice[]>;
  connectSerial(deviceId: string): Promise<DeviceInfo>;
  disconnect(): Promise<void>;
  getDeviceInfo(): Promise<DeviceInfo>;
  getLayers(): Promise<readonly Layer[]>;
  getKeyboardLayout(): Promise<KeyboardLayout | null>;
  getKeyBinding(layerId: LayerId, position: KeyPosition): Promise<KeyBinding>;
  setKeyBinding(layerId: LayerId, position: KeyPosition, binding: KeyBinding): Promise<KeyBinding>;
};

export type BleDeviceTransport = Pick<ZmkDeviceTransport, "disconnect"> & {
  scan(): Promise<never>;
  connectBle(deviceId: string): Promise<never>;
};

export class TodoBleTransport implements BleDeviceTransport {
  async scan(): Promise<never> {
    throw new TransportError("unsupported", "BLE transport is planned for a later phase.");
  }

  async connectBle(): Promise<never> {
    throw new TransportError("unsupported", "BLE transport is planned for a later phase.");
  }

  async disconnect(): Promise<void> {
    return undefined;
  }
}
