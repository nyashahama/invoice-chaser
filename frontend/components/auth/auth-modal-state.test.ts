import { describe, expect, it } from "vitest";

import { createEmptyAuthModalFields } from "./auth-modal-state";

describe("createEmptyAuthModalFields", () => {
  it("returns cleared credential fields for each reopen", () => {
    expect(createEmptyAuthModalFields()).toEqual({
      email: "",
      error: null,
      fullName: "",
      password: "",
      submitting: false,
    });
  });
});
