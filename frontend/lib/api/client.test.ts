import { describe, expect, it, vi } from "vitest";

import { createApiClient } from "./client";
import { ApiError } from "./errors";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
    },
    ...init,
  });
}

describe("api client", () => {
  it("refreshes the access token and retries the original request on 401", async () => {
    let token = "expired-token";

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse(
          {
            code: "UNAUTHORIZED",
            message: "expired",
          },
          { status: 401 },
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            access_token: "fresh-token",
          },
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            id: "user_123",
            email: "ada@example.com",
            full_name: "Ada Lovelace",
            plan: "trial",
            timezone: "Africa/Johannesburg",
            created_at: "2026-04-14T08:00:00Z",
          },
          { status: 200 },
        ),
      );

    const client = createApiClient({
      baseUrl: "https://api.example.com",
      fetch: fetchMock,
      tokenStore: {
        clear: () => {
          token = "";
        },
        get: () => token || null,
        set: (nextToken) => {
          token = nextToken;
        },
      },
    });

    const user = await client.get<{ email: string }>("/api/v1/users/me");

    expect(user.email).toBe("ada@example.com");
    expect(token).toBe("fresh-token");
    expect(fetchMock).toHaveBeenCalledTimes(3);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://api.example.com/api/v1/users/me",
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "https://api.example.com/api/v1/auth/refresh",
    );
    expect(fetchMock.mock.calls[2]?.[0]).toBe(
      "https://api.example.com/api/v1/users/me",
    );

    const firstRequest = fetchMock.mock.calls[0]?.[1];
    const retriedRequest = fetchMock.mock.calls[2]?.[1];

    expect(new Headers(firstRequest?.headers).get("Authorization")).toBe(
      "Bearer expired-token",
    );
    expect(new Headers(retriedRequest?.headers).get("Authorization")).toBe(
      "Bearer fresh-token",
    );
  });

  it("clears the access token if refresh fails", async () => {
    let token = "expired-token";

    const client = createApiClient({
      baseUrl: "https://api.example.com",
      fetch: vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(
          jsonResponse(
            {
              code: "UNAUTHORIZED",
              message: "expired",
            },
            { status: 401 },
          ),
        )
        .mockResolvedValueOnce(
          jsonResponse(
            {
              code: "UNAUTHORIZED",
              message: "refresh missing",
            },
            { status: 401 },
          ),
        ),
      tokenStore: {
        clear: () => {
          token = "";
        },
        get: () => token || null,
        set: (nextToken) => {
          token = nextToken;
        },
      },
    });

    await expect(client.get("/api/v1/users/me")).rejects.toBeInstanceOf(ApiError);
    expect(token).toBe("");
  });
});
