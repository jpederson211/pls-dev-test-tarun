import { describe, expect, it } from "vitest";
import { formatLastTouch, formatUnits } from "./format";

describe("formatLastTouch", () => {
  it("shows Never when there is no touch", () => {
    expect(formatLastTouch(null)).toBe("Never");
  });
  it("formats a date", () => {
    expect(formatLastTouch("2026-03-03T12:00:00.000Z")).toBe("Mar 3, 2026");
  });
});

describe("formatUnits", () => {
  it("shows a dash when units are unknown", () => {
    expect(formatUnits(null)).toBe("—");
  });
  it("shows the number of units", () => {
    expect(formatUnits(12)).toBe("12");
  });
  it("shows a check mark when units are verified", () => {
    expect(formatUnits(12, true)).toBe("12 ✓");
  });
  it("shows a dash without a check mark when units are unknown", () => {
    expect(formatUnits(null, true)).toBe("—");
  });
});
