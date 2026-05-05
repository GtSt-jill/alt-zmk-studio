export type DeviceId = string;
export type LayerId = number;
export type KeyPosition = number;

export type DeviceInfo = {
  id: DeviceId;
  name: string;
  manufacturer?: string;
  firmwareVersion?: string;
  keyCount: number;
};

export type Layer = {
  id: LayerId;
  name: string;
};

export type KeyPressBinding = {
  kind: "keyPress";
  code: string;
};

export type TransparentBinding = {
  kind: "transparent";
};

export type NoneBinding = {
  kind: "none";
};

export type UnsupportedBinding = {
  kind: "unsupported";
  behavior: string;
  params: readonly string[];
};

export type KeyBinding =
  | KeyPressBinding
  | TransparentBinding
  | NoneBinding
  | UnsupportedBinding;

export type KeymapKey = {
  position: KeyPosition;
  binding: KeyBinding;
};

export type KeymapLayer = {
  layer: Layer;
  keys: readonly KeymapKey[];
};

export type KeyboardLayoutKey = {
  position: KeyPosition;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  rotationX: number;
  rotationY: number;
};

export type KeyboardLayout = {
  keys: readonly KeyboardLayoutKey[];
};

export function createPlaceholderLayout(keyCount: number, columns = 12): KeyboardLayout {
  const safeColumns = Math.max(1, columns);
  return {
    keys: Array.from({ length: keyCount }, (_, position) => ({
      position,
      x: position % safeColumns,
      y: Math.floor(position / safeColumns),
      width: 1,
      height: 1,
      rotation: 0,
      rotationX: 0,
      rotationY: 0
    }))
  };
}

export function updateKeyBinding(
  layer: KeymapLayer,
  position: KeyPosition,
  binding: KeyBinding
): KeymapLayer {
  return {
    ...layer,
    keys: layer.keys.map((key) =>
      key.position === position ? { ...key, binding } : key
    )
  };
}
