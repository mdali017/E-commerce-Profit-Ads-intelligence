import { authStorage } from "./auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
  requiresTenant?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, requiresTenant = false, headers = {}, ...rest } = options;

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = authStorage.getToken();
    if (token) {
      reqHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  if (requiresTenant) {
    const tenantId = authStorage.getActiveTenantId();
    if (tenantId) {
      reqHeaders["X-Tenant-ID"] = tenantId;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: reqHeaders,
      ...rest,
    });
  } catch (err: any) {
    throw new Error(
      `Cannot connect to backend server at ${API_BASE_URL}. Please ensure the FastAPI server is running.`
    );
  }

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errorData = await response.json();
      errorDetail = errorData.detail || errorDetail;
    } catch {
      errorDetail = `Request failed with status ${response.status}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
