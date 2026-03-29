// /lib/uploadFile.ts
import { createClient } from "@/lib/supaBase/client";

export const uploadFile = async (file: File, userId: string) => {
  const supabase = createClient();

  const filePath = `${userId}/${Date.now()}-${file.name}`;

  console.log("Uploading file to path:", filePath);
  console.log("File size:", file.size, "bytes");

  const { data: uploadData, error } = await supabase.storage
    .from("uploaded_files")
    .upload(filePath, file);

  console.log("Upload response:", { data: uploadData, error });

  if (error) {
    console.error("Upload error details:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }

  console.log("File uploaded successfully. Path:", filePath);

  return {
    filePath,
    fileUrl: filePath, // Store only the path, not the full URL
  };
};
