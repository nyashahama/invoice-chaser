const ACCESS_TOKEN_KEY = "invoice-chaser.access-token";

import { buildAuthPresenceCookieValue } from "./proxy-auth";

function getStorage() {
  return (globalThis as typeof globalThis & { localStorage?: Storage })
    .localStorage;
}

function setDocumentCookie(value: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = value;
}

export function setAuthPresenceCookie() {
  setDocumentCookie(buildAuthPresenceCookieValue(true));
}

export function clearAuthPresenceCookie() {
  setDocumentCookie(buildAuthPresenceCookieValue(false));
}

export function getAccessToken() {
  try {
    return getStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

export function setAccessToken(token: string) {
  try {
    getStorage()?.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    // Ignore storage write failures and continue with in-memory state.
  }

  setAuthPresenceCookie();
}

export function clearAccessToken() {
  try {
    getStorage()?.removeItem(ACCESS_TOKEN_KEY);
  } catch {
    // Ignore storage removal failures and continue with in-memory state.
  }

  clearAuthPresenceCookie();
}
