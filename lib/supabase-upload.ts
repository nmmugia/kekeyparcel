import { createClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Upload a file to Supabase Storage
 * @param file The file buffer to upload
 * @param fileName Original file name (used to determine extension)
 * @param contentType MIME type of the file
 * @returns Public URL of the uploaded file
 */
export async function uploadFile(
    file: Buffer,
    fileName: string,
    contentType: string
): Promise<string> {
    // Generate a unique file name with original extension
    const fileExtension = fileName.split(".").pop() || ""
    const uniqueFileName = `${uuidv4()}.${fileExtension}`

    // Determine folder based on content type
    const folderPath = determineFolder(contentType)
    const filePath = `${folderPath}/${uniqueFileName}`

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "uploads"

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
            contentType,
            upsert: false,
        })

    if (error) {
        console.error("Error uploading to Supabase Storage:", error)
        throw new Error(`Failed to upload file: ${error.message}`)
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path)

    return publicUrlData.publicUrl
}

/**
 * Delete a file from Supabase Storage by its public URL
 * @param fileUrl The public URL of the file to delete
 */
export async function deleteFile(fileUrl: string): Promise<void> {
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "uploads"

    // Extract the file path from the URL
    // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const urlParts = fileUrl.split(`/storage/v1/object/public/${bucketName}/`)
    if (urlParts.length < 2) {
        throw new Error("Invalid Supabase Storage URL")
    }
    const filePath = urlParts[1]

    const { error } = await supabase.storage.from(bucketName).remove([filePath])

    if (error) {
        console.error("Error deleting from Supabase Storage:", error)
        throw new Error(`Failed to delete file: ${error.message}`)
    }
}

/**
 * Determine the folder path based on content type
 * @param contentType MIME type of the file
 * @returns Folder path for the file
 */
function determineFolder(contentType: string): string {
    if (contentType.startsWith("image/")) {
        return "images"
    } else if (contentType.startsWith("video/")) {
        return "videos"
    } else if (contentType.startsWith("application/pdf")) {
        return "documents/pdf"
    } else {
        return "others"
    }
}
