import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "../auth/session-storage";
import { API_BASE_URL } from "../config";

import { toApiError } from "./errors";
import type { RefreshTokenResponse } from "./types";

type JsonBody = object;
type RequestBody = BodyInit | JsonBody | null | undefined;

export interface TokenStore {
  clear: () => void;
  get: () => string | null;
  set: (token: string) => void;
}

export interface CreateApiClientOptions {
  baseUrl?: string;
  fetch?: typeof fetch;
  tokenStore?: TokenStore;
}

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: RequestBody;
  skipAuthRefresh?: boolean;
}

function isJsonBody(body: RequestBody): body is JsonBody {
  if (body === null || body === undefined) {
    return false;
  }

  return (
    typeof body === "object" &&
    !(body instanceof ArrayBuffer) &&
    !(body instanceof Blob) &&
    !(body instanceof FormData) &&
    !(body instanceof URLSearchParams) &&
    !(body instanceof ReadableStream)
  );
}

function buildUrl(baseUrl: string, path: string) {
  return new URL(path, `${baseUrl}/`).toString();
}

async function parseResponse<T>(response: Response) {
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

export function createApiClient(options: CreateApiClientOptions = {}) {
  const baseUrl = (options.baseUrl ?? API_BASE_URL).replace(/\/+$/, "");
  const fetchImpl = options.fetch ?? fetch;
  const tokenStore = options.tokenStore ?? {
    clear: clearAccessToken,
    get: getAccessToken,
    set: setAccessToken,
  };

  let refreshPromise: Promise<string> | null = null;

  async function refreshAccessToken() {
    if (!refreshPromise) {
      refreshPromise = (async () => {
        const response = await fetchImpl(buildUrl(baseUrl, "/api/v1/auth/refresh"), {
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
          method: "POST",
        });

        if (!response.ok) {
          tokenStore.clear();
          throw await toApiError(response);
        }

        const data = await parseResponse<RefreshTokenResponse>(response);
        tokenStore.set(data.access_token);
        return data.access_token;
      })().finally(() => {
        refreshPromise = null;
      });
    }

    return refreshPromise;
  }

  async function request<T>(
    path: string,
    options: ApiRequestOptions = {},
    retrying = false,
  ): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set("Accept", "application/json");

    let body = options.body;
    if (isJsonBody(body)) {
      body = JSON.stringify(body);
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
    }

    const accessToken = tokenStore.get();
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    const response = await fetchImpl(buildUrl(baseUrl, path), {
      ...options,
      body: body as BodyInit | null | undefined,
      credentials: "include",
      headers,
    });

    if (
      response.status === 401 &&
      !options.skipAuthRefresh &&
      !retrying &&
      path !== "/api/v1/auth/refresh"
    ) {
      try {
        await refreshAccessToken();
      } catch {
        tokenStore.clear();
        throw await toApiError(response);
      }

      return request<T>(path, options, true);
    }

    if (!response.ok) {
      throw await toApiError(response);
    }

    return parseResponse<T>(response);
  }

  return {
    delete: <T>(path: string, options?: ApiRequestOptions) =>
      request<T>(path, { ...options, method: "DELETE" }),
    get: <T>(path: string, options?: ApiRequestOptions) =>
      request<T>(path, { ...options, method: "GET" }),
    patch: <T>(path: string, body?: RequestBody, options?: ApiRequestOptions) =>
      request<T>(path, { ...options, body, method: "PATCH" }),
    post: <T>(path: string, body?: RequestBody, options?: ApiRequestOptions) =>
      request<T>(path, { ...options, body, method: "POST" }),
    refreshAccessToken,
    request,
  };
}

export const apiClient = createApiClient();
