// server/services/storage.service.js
import { supabase } from "../config/supabase.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "waste-media";

/**
 * Upload a file buffer to Supabase Storage.
 * @param {Express.Multer.File} file - multer file object
 * @param {string} folder - storage path prefix e.g. "batches/user-id"
 * @returns {Promise<string>} public URL of the uploaded file
 */
export async function uploadPhoto(file, folder = "uploads") {
  const ext = path.extname(file.originalname) || ".jpg";
  const filename = `${uuidv4()}${ext}`;
  const storagePath = `${folder}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

/**
 * Delete a file from Supabase Storage by its public URL.
 */
export async function deletePhoto(publicUrl) {
  try {
    const url = new URL(publicUrl);
    // Extract path after "/object/public/<bucket>/"
    const marker = `/object/public/${BUCKET}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return;
    const storagePath = url.pathname.slice(idx + marker.length);
    await supabase.storage.from(BUCKET).remove([storagePath]);
  } catch (err) {
    console.warn("deletePhoto failed (non-fatal):", err.message);
  }
}