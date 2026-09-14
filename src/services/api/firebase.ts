import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type FirebaseRuntimeConfig = {
  apiKey: string | null;
  authDomain: string | null;
  projectId: string | null;
  databaseURL: string | null;
  storageBucket: string | null;
  appId: string | null;
};

export async function getFirebaseRuntimeConfig(): Promise<FirebaseRuntimeConfig> {
  return apiClient<FirebaseRuntimeConfig>(API_ENDPOINTS.firebase.config);
}
