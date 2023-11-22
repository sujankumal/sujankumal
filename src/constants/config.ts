import { isNodeJs } from "@/services/check_node";

export const APP_BASE_URL = isNodeJs()? process.env.VERCEL_URL: 'http://localhost:3000/';
export const API_BASE_URL = isNodeJs()? process.env.VERCEL_URL: 'http://localhost:3000/';


export const WEEK_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
