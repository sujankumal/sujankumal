import { API_BASE_URL } from "@/constants/constants";

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiError extends Error {
  status: number;
  path: string;
  details?: string;

  constructor(status: number, path: string, details?: string) {
    super(`API request failed: ${path} (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.path = path;
    this.details = details;
  }
}

export type ApiRequestOptions<TBody = unknown> = Omit<RequestInit, "body"> & {
  method?: ApiMethod;
  body?: TBody;
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
};

export async function apiClient<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const { method = "GET", body, headers, ...rest } = options;

  const requestInit: RequestInit = {
    ...rest,
    method,
    headers: {
      Accept: "application/json",
      ...(body !== undefined && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body:
      body !== undefined && body !== null && !(body instanceof FormData)
        ? JSON.stringify(body)
        : body instanceof FormData
          ? body
          : undefined,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, requestInit);

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, path, text || undefined);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

export async function apiGet<TResponse>(path: string, next?: { revalidate?: number | false; tags?: string[] }): Promise<TResponse> {
  return apiClient<TResponse>(path, { method: "GET", next });
}

export async function apiPost<TResponse, TBody = unknown>(path: string, body: TBody, init?: Omit<ApiRequestOptions<TBody>, "method" | "body">): Promise<TResponse> {
  return apiClient<TResponse>(path, { ...init, method: "POST", body });
}

export async function apiPut<TResponse, TBody = unknown>(path: string, body: TBody, init?: Omit<ApiRequestOptions<TBody>, "method" | "body">): Promise<TResponse> {
  return apiClient<TResponse>(path, { ...init, method: "PUT", body });
}

export async function apiPatch<TResponse, TBody = unknown>(path: string, body: TBody, init?: Omit<ApiRequestOptions<TBody>, "method" | "body">): Promise<TResponse> {
  return apiClient<TResponse>(path, { ...init, method: "PATCH", body });
}

export async function apiDelete<TResponse>(path: string, init?: Omit<ApiRequestOptions, "method">): Promise<TResponse> {
  return apiClient<TResponse>(path, { ...init, method: "DELETE" });
}
