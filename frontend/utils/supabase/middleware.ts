import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Creates a Supabase client and handles cookie management for server-side requests.
 * @param {NextRequest} request - The incoming request object.
 * @returns {Object} Supabase client and the response object with cookie management.
 */
export const createClient = (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Initialize Supabase client with cookie management
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll(); // Get all cookies from the request
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value) // Set cookies in the request
          );
          supabaseResponse = NextResponse.next({ request }); // Update response with new cookies
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options) // Set cookies in the response
          );
        },
      },
    }
  );

  return { supabase, supabaseResponse }; // Return the Supabase client and response
};
