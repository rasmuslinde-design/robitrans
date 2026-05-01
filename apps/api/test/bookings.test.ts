import request from "supertest";
import { describe, expect, it } from "vitest";

// Note: this is a lightweight smoke test that assumes the server is started on-demand.
// In this repo we keep it simple and test pure helpers separately.

import { isWeekend } from "../src/validation";

describe("validation", () => {
  it("detects weekend", () => {
    expect(isWeekend("2026-05-02")).toBe(true); // Saturday
    expect(isWeekend("2026-05-04")).toBe(false); // Monday
  });
});

// Placeholder to ensure supertest is wired; app is not exported yet.
describe("api", () => {
  it("placeholder", async () => {
    expect(request).toBeDefined();
  });
});
