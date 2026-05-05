import {
  deviceInfoFromDto,
  keyboardLayoutFromDto,
  keyBindingFromDto,
  keyBindingToDto,
  layerFromDto,
  type DeviceInfoDto,
  type KeyboardLayoutDto,
  type KeyBindingDto,
  type LayerDto
} from "@alt-zmk-studio/core";
import type {
  DeviceInfo,
  KeyBinding,
  KeyboardLayout,
  KeyPosition,
  Layer,
  LayerId
} from "@alt-zmk-studio/core";
import { invoke } from "@tauri-apps/api/core";
import { TransportError, type SerialDevice, type TransportErrorCode, type ZmkDeviceTransport } from "@alt-zmk-studio/transport";

type BackendError = {
  code?: TransportErrorCode;
  message?: string;
};

function isTransportErrorCode(value: string): value is TransportErrorCode {
  return [
    "notConnected",
    "permissionDenied",
    "timeout",
    "unsupported",
    "deviceError",
    "unknown"
  ].includes(value);
}

function normalizeError(error: unknown): TransportError {
  if (error instanceof TransportError) {
    return error;
  }
  if (error instanceof Error) {
    return new TransportError("unknown", error.message);
  }
  if (typeof error === "object" && error !== null) {
    const backend = error as BackendError;
    if (backend.code && backend.message) {
      return new TransportError(backend.code, backend.message);
    }
    const record = error as Record<string, unknown>;
    const message =
      typeof record.message === "string"
        ? record.message
        : typeof record.error === "string"
          ? record.error
          : JSON.stringify(record);
    const code =
      typeof record.code === "string" && isTransportErrorCode(record.code)
        ? record.code
        : "unknown";
    return new TransportError(code, message);
  }
  if (typeof error === "string") {
    return new TransportError("unknown", error);
  }
  return new TransportError("unknown", "Unexpected transport error.");
}

async function invokeTransport<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(command, args);
  } catch (error) {
    throw normalizeError(error);
  }
}

export class TauriZmkDeviceTransport implements ZmkDeviceTransport {
  async listSerialDevices(): Promise<readonly SerialDevice[]> {
    return invokeTransport<SerialDevice[]>("list_serial_devices");
  }

  async connectSerial(deviceId: string): Promise<DeviceInfo> {
    return deviceInfoFromDto(await invokeTransport<DeviceInfoDto>("connect_serial", { deviceId }));
  }

  async disconnect(): Promise<void> {
    await invokeTransport<void>("disconnect_device");
  }

  async getDeviceInfo(): Promise<DeviceInfo> {
    return deviceInfoFromDto(await invokeTransport<DeviceInfoDto>("get_device_info"));
  }

  async getLayers(): Promise<readonly Layer[]> {
    const layers = await invokeTransport<LayerDto[]>("get_layers");
    return layers.map(layerFromDto);
  }

  async getKeyboardLayout(): Promise<KeyboardLayout | null> {
    const layout = await invokeTransport<KeyboardLayoutDto | null>("get_keyboard_layout");
    return layout ? keyboardLayoutFromDto(layout) : null;
  }

  async getKeyBinding(layerId: LayerId, position: KeyPosition): Promise<KeyBinding> {
    return keyBindingFromDto(
      await invokeTransport<KeyBindingDto>("get_key_binding", { layerId, position })
    );
  }

  async setKeyBinding(layerId: LayerId, position: KeyPosition, binding: KeyBinding): Promise<KeyBinding> {
    return keyBindingFromDto(
      await invokeTransport<KeyBindingDto>("set_key_binding", {
        layerId,
        position,
        binding: keyBindingToDto(binding)
      })
    );
  }
}
