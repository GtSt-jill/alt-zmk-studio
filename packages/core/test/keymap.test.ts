import { describe, expect, it } from "vitest";
import { createPlaceholderLayout, updateKeyBinding } from "../src/keymap";

describe("createPlaceholderLayout", () => {
  it("creates a stable grid", () => {
    expect(createPlaceholderLayout(3, 2).keys).toEqual([
      { position: 0, x: 0, y: 0, width: 1, height: 1, rotation: 0, rotationX: 0, rotationY: 0 },
      { position: 1, x: 1, y: 0, width: 1, height: 1, rotation: 0, rotationX: 0, rotationY: 0 },
      { position: 2, x: 0, y: 1, width: 1, height: 1, rotation: 0, rotationX: 0, rotationY: 0 }
    ]);
  });
});

describe("updateKeyBinding", () => {
  it("updates only the matching key", () => {
    const layer = {
      layer: { id: 0, name: "Base" },
      keys: [
        { position: 0, binding: { kind: "keyPress" as const, code: "A" } },
        { position: 1, binding: { kind: "keyPress" as const, code: "B" } }
      ]
    };

    expect(updateKeyBinding(layer, 1, { kind: "keyPress", code: "C" }).keys).toEqual([
      { position: 0, binding: { kind: "keyPress", code: "A" } },
      { position: 1, binding: { kind: "keyPress", code: "C" } }
    ]);
  });
});
