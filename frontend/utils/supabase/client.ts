/** 
 * @file supabaseClient.ts
 * @description This file handles the creation of Supabase clients for both server-side and browser-side requests.
 * It provides functions to create Supabase clients, attach authentication tokens, and manage cookies.
 */

import { createBrowserClient } from "@supabase/ssr";


/**
 * Creates a Supabase client for use on the client-side.
 * This client will be used to interact with Supabase from the browser.
 */
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      realtime: {
        log_level: "debug",
      },
    }
  );

export const supabase = createClient();

// our api client will use this function to attach auth token with API requests
export const getAuthToken = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || null;
};
