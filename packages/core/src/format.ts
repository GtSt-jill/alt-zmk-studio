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
  SPACE: "Space",
  TAB: "Tab",
  BSPC: "Backspace",
  DEL: "Delete"
};

export function formatKeyBinding(binding: KeyBinding): string {
  switch (binding.kind) {
    case "keyPress":
      return keyLabels[binding.code] ?? binding.code;
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
  "SPACE",
  "TAB",
  "BSPC",
  "DEL"
] as const;
