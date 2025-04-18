/**
 * @file apiClient.ts
 * @description This module creates and configures an Axios instance for making HTTP requests 
 * to the API. 
 * 
 * It attaches the Supabase authentication token to the headers of outgoing requests 
 * using an Axios request interceptor. The base URL for the API is set based on the environment variable 
 * `NEXT_PUBLIC_API_URL` or defaults to `http://localhost:8000/api` if not provided.
 */

import axios from "axios";
import { getAuthToken } from "@/utils/supabase/client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// attach supabase auth token
apiClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
