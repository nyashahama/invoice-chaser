export const AUTH_PRESENCE_COOKIE_NAME = "invoice_chaser_auth";
export const AUTH_PRESENCE_COOKIE_VALUE = "1";
export const AUTH_PRESENCE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

const PROTECTED_PREFIXES = ["/dashboard"];

export function buildAuthPresenceCookieValue(isAuthenticated: boolean) {
  return isAuthenticated
    ? `${AUTH_PRESENCE_COOKIE_NAME}=${AUTH_PRESENCE_COOKIE_VALUE}; Path=/; Max-Age=${AUTH_PRESENCE_COOKIE_MAX_AGE}; SameSite=Lax`
    : `${AUTH_PRESENCE_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function shouldRedirectFromProtectedRoute(
  pathname: string,
  authPresenceCookie: string | undefined,
) {
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isProtected) {
    return false;
  }

  return authPresenceCookie !== AUTH_PRESENCE_COOKIE_VALUE;
}
