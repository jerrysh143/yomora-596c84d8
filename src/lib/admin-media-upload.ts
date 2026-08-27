import { supabase } from "@/integrations/supabase/client";

type AdminMediaUpload = {
  url: string;
  path: string;
};

/** Uploads an already-compressed product/site image to the persistent Hostinger media site. */
export async function uploadAdminImage(blob: Blob, fileName: string): Promise<AdminMediaUpload> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (sessionError || !token) throw new Error("Your admin session has expired. Sign in again.");

  const form = new FormData();
  form.set("file", blob, fileName);
  const response = await fetch("/api/admin-media", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const payload = await response.json().catch(() => null) as { message?: string; url?: string; path?: string } | null;
  if (!response.ok || !payload?.url || !payload.path) {
    throw new Error(payload?.message || "Image upload failed");
  }
  return { url: payload.url, path: payload.path };
}
