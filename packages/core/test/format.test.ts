import { describe, expect, it } from "vitest";
import { formatKeyBinding } from "../src/format";

describe("formatKeyBinding", () => {
  it("formats key press labels", () => {
    expect(formatKeyBinding({ kind: "keyPress", code: "ENTER" })).toBe("Enter");
    expect(formatKeyBinding({ kind: "keyPress", code: "A" })).toBe("A");
  });

  it("formats fallback bindings", () => {
    expect(formatKeyBinding({ kind: "transparent" })).toBe("▽");
    expect(formatKeyBinding({ kind: "none" })).toBe("None");
    expect(formatKeyBinding({ kind: "unsupported", behavior: "&mo", params: ["1"] })).toBe("&mo 1");
  });
});
