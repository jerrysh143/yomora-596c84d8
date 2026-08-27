import { createFileRoute } from "@tanstack/react-router";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function json(message: string, status: number, extra?: Record<string, unknown>) {
  return Response.json({ message, ...extra }, { status });
}

function bearerToken(request: Request) {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

async function hasValidSignature(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const text = String.fromCharCode(...bytes);
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (file.type === "image/png") return bytes[0] === 0x89 && text.slice(1, 4) === "PNG";
  if (file.type === "image/webp") return text.slice(0, 4) === "RIFF" && text.slice(8, 12) === "WEBP";
  return false;
}

async function authenticatedAdmin(request: Request) {
  const token = bearerToken(request);
  if (!token) return null;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  const { data: allowed, error: roleError } = await supabaseAdmin.rpc("has_role", {
    _user_id: data.user.id,
    _role: "admin",
  });
  return roleError || !allowed ? null : data.user;
}

export const Route = createFileRoute("/api/admin-media")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const admin = await authenticatedAdmin(request);
        if (!admin) return json("Administrator access required", 403);

        const storageRoot = process.env.MEDIA_STORAGE_ROOT?.trim();
        const publicBase = process.env.MEDIA_PUBLIC_BASE_URL?.trim().replace(/\/$/, "");
        if (!storageRoot || !publicBase || !/^https:\/\//i.test(publicBase)) {
          return json("Hostinger media storage is not configured", 503);
        }

        const form = await request.formData().catch(() => null);
        const file = form?.get("file");
        if (!(file instanceof File) || !IMAGE_TYPES.has(file.type) || file.size < 1 ||
          file.size > MAX_IMAGE_BYTES || !(await hasValidSignature(file))) {
          return json("Choose a valid JPG, PNG, or WebP image up to 8 MB", 400);
        }

        const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
        const relativePath = `site-images/${crypto.randomUUID()}.${extension}`;
        const [{ mkdir, writeFile }, pathModule] = await Promise.all([
          import("node:fs/promises"),
          import("node:path"),
        ]);
        const root = pathModule.resolve(storageRoot);
        const target = pathModule.resolve(root, relativePath);
        if (!target.startsWith(`${root}${pathModule.sep}`)) return json("Invalid media path", 400);

        try {
          await mkdir(pathModule.dirname(target), { recursive: true });
          await writeFile(target, new Uint8Array(await file.arrayBuffer()), { flag: "wx" });
        } catch (error) {
          console.error("Hostinger media upload failed", error);
          return json("Unable to save image to Hostinger storage", 500);
        }

        return json("Uploaded", 201, {
          path: relativePath,
          url: `${publicBase}/${relativePath}`,
        });
      },
    },
  },
});
