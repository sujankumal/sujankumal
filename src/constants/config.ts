import { isNodeJs } from "@/services/check_node";

export const APP_BASE_URL = isNodeJs()? process.env.VERCEL_URL: 'http://localhost:3000/';
export const API_BASE_URL = isNodeJs()? process.env.VERCEL_URL: 'http://localhost:3000/';