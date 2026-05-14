// Helpers for uploading images to the public 'uploads' bucket.
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MiB
const ALLOWED = ["image/png", "image/jpeg", "image/gif", "image/webp"];

export type UploadResult =
  | { ok: true; publicUrl: string; path: string }
  | { ok: false; error: string };

export async function uploadImage(file: File): Promise<UploadResult> {
  if (!ALLOWED.includes(file.type)) {
    return { ok: false, error: "仅支持 PNG / JPEG / GIF / WebP 图片" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "图片大小不能超过 5 MB" };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "请先登录" };

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const path = `${user.id}/${Date.now()}-${random}.${ext}`;

  const { error } = await supabase.storage
    .from("uploads")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) return { ok: false, error: error.message };

  const { data } = supabase.storage.from("uploads").getPublicUrl(path);
  return { ok: true, publicUrl: data.publicUrl, path };
}
