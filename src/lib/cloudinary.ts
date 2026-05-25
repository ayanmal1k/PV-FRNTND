const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export type CloudinaryUploadResult = {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
};

export async function uploadImageToCloudinary(file: File): Promise<CloudinaryUploadResult> {
  if (!cloudName || !uploadPreset) {
    throw new Error("Missing Cloudinary environment variables");
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", uploadPreset);
  body.append("folder", "propvault/properties");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "Image upload failed");
  }

  return {
    url: data.url,
    secureUrl: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
  };
}
