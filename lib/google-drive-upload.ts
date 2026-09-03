import { google } from "googleapis"
import { Readable } from "stream"
import { v4 as uuidv4 } from "uuid"

// Initialize Google Drive API client
function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  })

  return google.drive({ version: "v3", auth })
}

/**
 * Upload a file to Google Drive
 * @param file The file buffer to upload
 * @param fileName Original file name (used to determine extension)
 * @param contentType MIME type of the file
 * @returns Shareable public URL of the uploaded file
 */
export async function uploadFile(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  try {
    const drive = getDriveClient()
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID

    if (!folderId) {
      throw new Error("GOOGLE_DRIVE_FOLDER_ID not configured")
    }

    // Generate a unique file name with original extension
    const fileExtension = fileName.split(".").pop() || ""
    const uniqueFileName = `${uuidv4()}.${fileExtension}`

    // Convert buffer to readable stream
    const fileStream = Readable.from(file)

    // Upload to Google Drive
    const response = await drive.files.create({
      requestBody: {
        name: uniqueFileName,
        parents: [folderId],
      },
      media: {
        mimeType: contentType,
        body: fileStream,
      },
      fields: "id, webViewLink, webContentLink",
    })

    const fileId = response.data.id

    if (!fileId) {
      throw new Error("Failed to get file ID from Google Drive")
    }

    // Make the file publicly accessible
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    })

    // Return direct download URL
    // Format: https://drive.google.com/uc?export=view&id={fileId}
    return `https://drive.google.com/uc?export=view&id=${fileId}`
  } catch (error) {
    console.error("Error uploading to Google Drive:", error)
    throw error
  }
}

/**
 * Delete a file from Google Drive by its URL
 * @param fileUrl The public URL of the file to delete
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const drive = getDriveClient()

    // Extract file ID from URL
    // Format: https://drive.google.com/uc?export=view&id={fileId}
    const fileIdMatch = fileUrl.match(/[?&]id=([^&]+)/)
    if (!fileIdMatch) {
      throw new Error("Invalid Google Drive URL format")
    }

    const fileId = fileIdMatch[1]

    await drive.files.delete({
      fileId,
    })
  } catch (error) {
    console.error("Error deleting from Google Drive:", error)
    throw error
  }
}

/**
 * Check if a URL is from Supabase storage (for backward compatibility)
 * @param url The URL to check
 * @returns True if the URL is from Supabase
 */
export function isSupabaseUrl(url: string): boolean {
  return url.includes("supabase.co/storage/v1/object/public/")
}

/**
 * Check if a URL is from Google Drive
 * @param url The URL to check
 * @returns True if the URL is from Google Drive
 */
export function isGoogleDriveUrl(url: string): boolean {
  return url.includes("drive.google.com")
}
