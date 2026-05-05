import { create } from "zustand";
import {
  createPlaceholderLayout,
  updateKeyBinding,
  type DeviceInfo,
  type KeyboardLayout,
  type KeyBinding,
  type KeymapLayer,
  type KeyPosition,
  type Layer,
  type LayerId
} from "@alt-zmk-studio/core";
import { TransportError, type SerialDevice } from "@alt-zmk-studio/transport";
import { getDeviceTransport } from "../services/deviceService";

type ConnectionStatus = "idle" | "loading" | "connected" | "error";

type DeviceState = {
  devices: readonly SerialDevice[];
  selectedDeviceId: string;
  status: ConnectionStatus;
  error: string | null;
  deviceInfo: DeviceInfo | null;
  layers: readonly Layer[];
  activeLayerId: LayerId | null;
  layout: KeyboardLayout | null;
  loadedLayers: Record<number, KeymapLayer>;
  selectedPosition: KeyPosition | null;
  refreshDevices: () => Promise<void>;
  selectDevice: (deviceId: string) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setActiveLayer: (layerId: LayerId) => Promise<void>;
  selectKey: (position: KeyPosition) => void;
  setSelectedKeyPress: (code: string) => Promise<void>;
  clearError: () => void;
};

function errorMessage(error: unknown): string {
  if (error instanceof TransportError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error.";
}

async function loadLayer(layerId: LayerId, keyCount: number): Promise<KeymapLayer> {
  const transport = getDeviceTransport();
  const keys = await Promise.all(
    Array.from({ length: keyCount }, async (_, position) => ({
      position,
      binding: await transport.getKeyBinding(layerId, position)
    }))
  );
  return {
    layer: { id: layerId, name: `Layer ${layerId}` },
    keys
  };
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: [],
  selectedDeviceId: "",
  status: "idle",
  error: null,
  deviceInfo: null,
  layers: [],
  activeLayerId: null,
  layout: null,
  loadedLayers: {},
  selectedPosition: null,

  async refreshDevices() {
    set({ status: "loading", error: null });
    try {
      const devices = await getDeviceTransport().listSerialDevices();
      set((state) => ({
        devices,
        selectedDeviceId: state.selectedDeviceId || devices[0]?.id || "",
        status: state.deviceInfo ? "connected" : "idle"
      }));
    } catch (error) {
      set({ status: "error", error: errorMessage(error) });
    }
  },

  selectDevice(deviceId) {
    set({ selectedDeviceId: deviceId });
  },

  async connect() {
    const deviceId = get().selectedDeviceId;
    if (!deviceId) {
      set({ status: "error", error: "Select a serial device first." });
      return;
    }
    set({ status: "loading", error: null });
    try {
      const transport = getDeviceTransport();
      const deviceInfo = await transport.connectSerial(deviceId);
      const layers = await transport.getLayers();
      const layout = (await transport.getKeyboardLayout()) ?? createPlaceholderLayout(deviceInfo.keyCount);
      const activeLayerId = layers[0]?.id ?? 0;
      const activeLayer = await loadLayer(activeLayerId, deviceInfo.keyCount);
      const resolvedLayer = layers.find((layer) => layer.id === activeLayerId) ?? activeLayer.layer;
      set({
        status: "connected",
        deviceInfo,
        layers,
        layout,
        activeLayerId,
        loadedLayers: {
          [activeLayerId]: { ...activeLayer, layer: resolvedLayer }
        },
        selectedPosition: null
      });
    } catch (error) {
      set({ status: "error", error: errorMessage(error) });
    }
  },

  async disconnect() {
    set({ status: "loading", error: null });
    try {
      await getDeviceTransport().disconnect();
      set({
        status: "idle",
        deviceInfo: null,
        layers: [],
        activeLayerId: null,
        layout: null,
        loadedLayers: {},
        selectedPosition: null
      });
    } catch (error) {
      set({ status: "error", error: errorMessage(error) });
    }
  },

  async setActiveLayer(layerId) {
    const { deviceInfo, loadedLayers, layers } = get();
    if (!deviceInfo) {
      return;
    }
    set({ activeLayerId: layerId, status: "loading", error: null });
    try {
      if (loadedLayers[layerId]) {
        set({ status: "connected" });
        return;
      }
      const layer = await loadLayer(layerId, deviceInfo.keyCount);
      const resolvedLayer = layers.find((candidate) => candidate.id === layerId) ?? layer.layer;
      set((state) => ({
        status: "connected",
        loadedLayers: {
          ...state.loadedLayers,
          [layerId]: { ...layer, layer: resolvedLayer }
        }
      }));
    } catch (error) {
      set({ status: "error", error: errorMessage(error) });
    }
  },

  selectKey(position) {
    set({ selectedPosition: position });
  },

  async setSelectedKeyPress(code) {
    const { activeLayerId, selectedPosition } = get();
    if (activeLayerId === null || selectedPosition === null) {
      return;
    }
    const nextBinding: KeyBinding = { kind: "keyPress", code };
    set({ status: "loading", error: null });
    try {
      const savedBinding = await getDeviceTransport().setKeyBinding(
        activeLayerId,
        selectedPosition,
        nextBinding
      );
      set((state) => {
        const layer = state.loadedLayers[activeLayerId];
        if (!layer) {
          return { status: "connected" };
        }
        return {
          status: "connected",
          loadedLayers: {
            ...state.loadedLayers,
            [activeLayerId]: updateKeyBinding(layer, selectedPosition, savedBinding)
          }
        };
      });
    } catch (error) {
      set({ status: "error", error: errorMessage(error) });
    }
  },

  clearError() {
    set({ error: null, status: get().deviceInfo ? "connected" : "idle" });
  }
}));
