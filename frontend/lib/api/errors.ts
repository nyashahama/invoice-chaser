export interface ApiErrorPayload {
  code?: string;
  message?: string;
  [key: string]: unknown;
}

interface ApiErrorOptions {
  code: string;
  details?: unknown;
  status: number;
}

export class ApiError extends Error {
  code: string;
  details?: unknown;
  status: number;

  constructor(message: string, options: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;
    this.details = options.details;
    this.status = options.status;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export async function toApiError(response: Response) {
  let payload: ApiErrorPayload | null = null;

  try {
    payload = (await response.clone().json()) as ApiErrorPayload;
  } catch {
    payload = null;
  }

  return new ApiError(
    payload?.message || response.statusText || "Request failed",
    {
      code: payload?.code || "API_ERROR",
      details: payload,
      status: response.status,
    },
  );
}
