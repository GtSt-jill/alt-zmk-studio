import type { KeyBinding } from "./keymap";

const keyLabels: Record<string, string> = {
  A: "A",
  B: "B",
  C: "C",
  D: "D",
  E: "E",
  F: "F",
  G: "G",
  H: "H",
  I: "I",
  J: "J",
  K: "K",
  L: "L",
  M: "M",
  N: "N",
  O: "O",
  P: "P",
  Q: "Q",
  R: "R",
  S: "S",
  T: "T",
  U: "U",
  V: "V",
  W: "W",
  X: "X",
  Y: "Y",
  Z: "Z",
  ENTER: "Enter",
  ESC: "Esc",
  SPC: "Space",
  TAB: "Tab",
  BSPC: "Backspace",
  DEL: "Delete",
  LCTL: "L Ctrl",
  LSHFT: "L Shift",
  LALT: "L Alt",
  LGUI: "L Gui",
  RCTL: "R Ctrl",
  RSHFT: "R Shift",
  RALT: "R Alt",
  RGUI: "R Gui"
};

export function formatKeyBinding(binding: KeyBinding): string {
  switch (binding.kind) {
    case "keyPress":
      return keyLabels[binding.code] ?? binding.code;
    case "keyToggle":
      return `&kt ${keyLabels[binding.code] ?? binding.code}`;
    case "stickyKey":
      return `&sk ${keyLabels[binding.code] ?? binding.code}`;
    case "momentaryLayer":
      return `MO ${binding.layerId}`;
    case "toggleLayer":
      return `TG ${binding.layerId}`;
    case "toLayer":
      return `TO ${binding.layerId}`;
    case "stickyLayer":
      return `SL ${binding.layerId}`;
    case "layerTap":
      return `LT ${binding.layerId} ${keyLabels[binding.tap] ?? binding.tap}`;
    case "modTap":
      return `MT ${keyLabels[binding.hold] ?? binding.hold} ${keyLabels[binding.tap] ?? binding.tap}`;
    case "transparent":
      return "▽";
    case "none":
      return "None";
    case "unsupported":
      return `${binding.behavior} ${binding.params.join(" ")}`.trim();
  }
}

export const commonKeyPressCodes = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "ENTER",
  "ESC",
  "SPC",
  "TAB",
  "BSPC",
  "DEL"
] as const;

export const commonModifierCodes = [
  "LCTL",
  "LSHFT",
  "LALT",
  "LGUI",
  "RCTL",
  "RSHFT",
  "RALT",
  "RGUI"
] as const;
