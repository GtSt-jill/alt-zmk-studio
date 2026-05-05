import type { DeviceInfo, KeyBinding, KeyboardLayout, KeymapLayer, Layer } from "./keymap";

export type DeviceInfoDto = {
  id: string;
  name: string;
  manufacturer?: string | null;
  firmwareVersion?: string | null;
  keyCount: number;
};

export type LayerDto = {
  id: number;
  name: string;
};

export type KeyBindingDto = {
  kind: "keyPress" | "transparent" | "none" | "unsupported";
  code?: string | null;
  behavior?: string | null;
  params?: string[] | null;
};

export type KeymapKeyDto = {
  position: number;
  binding: KeyBindingDto;
};

export type KeyboardLayoutDto = {
  keys: Array<{
    position: number;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number | null;
    rotationX?: number | null;
    rotationY?: number | null;
  }>;
};

export function deviceInfoFromDto(dto: DeviceInfoDto): DeviceInfo {
  const info: DeviceInfo = {
    id: dto.id,
    name: dto.name,
    keyCount: dto.keyCount
  };
  if (dto.manufacturer) {
    info.manufacturer = dto.manufacturer;
  }
  if (dto.firmwareVersion) {
    info.firmwareVersion = dto.firmwareVersion;
  }
  return info;
}

export function layerFromDto(dto: LayerDto): Layer {
  return {
    id: dto.id,
    name: dto.name
  };
}

export function keyBindingFromDto(dto: KeyBindingDto): KeyBinding {
  if (dto.kind === "keyPress" && dto.code) {
    return { kind: "keyPress", code: dto.code };
  }
  if (dto.kind === "transparent") {
    return { kind: "transparent" };
  }
  if (dto.kind === "none") {
    return { kind: "none" };
  }
  return {
    kind: "unsupported",
    behavior: dto.behavior ?? "unknown",
    params: dto.params ?? []
  };
}

export function keyBindingToDto(binding: KeyBinding): KeyBindingDto {
  switch (binding.kind) {
    case "keyPress":
      return { kind: "keyPress", code: binding.code };
    case "transparent":
      return { kind: "transparent" };
    case "none":
      return { kind: "none" };
    case "unsupported":
      return {
        kind: "unsupported",
        behavior: binding.behavior,
        params: [...binding.params]
      };
  }
}

export function keymapLayerFromDtos(layer: LayerDto, keys: KeymapKeyDto[]): KeymapLayer {
  return {
    layer: layerFromDto(layer),
    keys: keys.map((key) => ({
      position: key.position,
      binding: keyBindingFromDto(key.binding)
    }))
  };
}

export function keyboardLayoutFromDto(dto: KeyboardLayoutDto): KeyboardLayout {
  return {
    keys: dto.keys.map((key) => ({
      position: key.position,
      x: key.x,
      y: key.y,
      width: key.width,
      height: key.height,
      rotation: key.rotation ?? 0,
      rotationX: key.rotationX ?? 0,
      rotationY: key.rotationY ?? 0
    }))
  };
}
