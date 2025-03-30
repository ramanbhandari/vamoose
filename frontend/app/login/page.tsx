/**
 * @file LoginPage.tsx
 * @description Server-side rendered login page that redirects authenticated users and displays the AuthForm component.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AuthForm from "./AuthForm";

export default async function LoginPage() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <AuthForm />
    </main>
  );
}
