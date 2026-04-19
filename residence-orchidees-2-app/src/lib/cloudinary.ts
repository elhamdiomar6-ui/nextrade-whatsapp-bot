import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

/**
 * Extract the Cloudinary public_id + resource_type from a secure_url.
 * Raw files (PDFs, docs…) keep their extension in the public_id.
 */
export function parseCloudinaryUrl(
  url: string
): { publicId: string; resourceType: string } | null {
  const match = url.match(
    /res\.cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+)$/i
  );
  if (!match) return null;
  const resourceType = match[1];
  let publicId = match[2];
  // Images and videos: strip extension (Cloudinary derives it)
  if (resourceType !== "raw") {
    publicId = publicId.replace(/\.[a-z0-9]{2,5}$/i, "");
  }
  return { publicId, resourceType };
}

/** Delete a Cloudinary asset by its secure_url. Silently ignores errors. */
export async function cloudinaryDestroy(url: string): Promise<void> {
  if (!url.includes("cloudinary.com")) return;
  const parsed = parseCloudinaryUrl(url);
  if (!parsed) return;
  try {
    await cloudinary.uploader.destroy(parsed.publicId, {
      resource_type: parsed.resourceType as "image" | "video" | "raw",
    });
  } catch { /* already deleted or network error — ignore */ }
}
