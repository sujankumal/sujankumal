import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type MfaStatusResponse = {
  enabled: boolean;
  secret?: string;
  otpUri?: string;
  error?: string;
  success?: boolean;
  backupCodes?: string[];
};

export type ImageLibraryItem = {
  path: string;
  name: string;
  folder: string;
};

export type FirebaseDataResponse = {
  path: string;
  exists: boolean;
  data: unknown;
};

export type FirebaseMutationResponse = {
  success: boolean;
  path: string;
  message?: string;
  error?: string;
  key?: string;
  fullPath?: string;
};

export type AdminListResponse<T = any> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export async function getRelationOptions(entityNames: string[]): Promise<Record<string, any[]>> {
  const params = new URLSearchParams({ entity: entityNames.join(",") });
  return apiClient<Record<string, any[]>>(`${API_ENDPOINTS.admin.relations}?${params.toString()}`);
}

export async function listAdminRecords<T = any>(entity: string, params: Record<string, string | number | undefined>): Promise<AdminListResponse<T>> {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  return apiClient<AdminListResponse<T>>(`/api/admin/${entity}?${searchParams.toString()}`);
}

export async function createAdminRecord<T = any>(entity: string, payload: T): Promise<any> {
  return apiClient<any>(`/api/admin/${entity}`, {
    method: "POST",
    body: payload,
  });
}

export async function updateAdminRecord<T = any>(entity: string, payload: T): Promise<any> {
  return apiClient<any>(`/api/admin/${entity}`, {
    method: "PUT",
    body: payload,
  });
}

export async function deleteAdminRecord(entity: string, id: string | number): Promise<void> {
  await apiClient<void>(`/api/admin/${entity}?id=${encodeURIComponent(String(id))}`, {
    method: "DELETE",
  });
}

export async function getMfaStatus(): Promise<MfaStatusResponse> {
  return apiClient<MfaStatusResponse>(API_ENDPOINTS.admin.mfa);
}

export async function enableMfa(payload: { token: string; secret: string }): Promise<MfaStatusResponse> {
  return apiClient<MfaStatusResponse>(API_ENDPOINTS.admin.mfa, {
    method: "POST",
    body: payload,
  });
}

export async function disableMfa(payload: { password: string }): Promise<MfaStatusResponse> {
  return apiClient<MfaStatusResponse>(API_ENDPOINTS.admin.mfa, {
    method: "DELETE",
    body: payload,
  });
}

export async function getImageLibrary(): Promise<ImageLibraryItem[]> {
  return apiClient<ImageLibraryItem[]>(API_ENDPOINTS.admin.images);
}

export async function getFirebaseData(path: string): Promise<FirebaseDataResponse> {
  const params = new URLSearchParams({ path });
  return apiClient<FirebaseDataResponse>(`${API_ENDPOINTS.admin.firebase}?${params.toString()}`);
}

export async function setFirebaseData(path: string, value: unknown): Promise<FirebaseMutationResponse> {
  return apiClient<FirebaseMutationResponse>(API_ENDPOINTS.admin.firebase, {
    method: "PUT",
    body: { path, value },
  });
}

export async function deleteFirebaseData(path: string): Promise<FirebaseMutationResponse> {
  const params = new URLSearchParams({ path });
  return apiClient<FirebaseMutationResponse>(`${API_ENDPOINTS.admin.firebase}?${params.toString()}`, {
    method: "DELETE",
  });
}
