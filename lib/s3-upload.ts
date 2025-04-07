import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { v4 as uuidv4 } from "uuid"

// Check if AWS environment variables are available
const isAwsConfigured =
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION &&
    process.env.AWS_BUCKET_NAME

// Initialize S3 client if AWS is configured
const s3Client = isAwsConfigured
    ? new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    })
    : null

/**
 * Upload a file to AWS S3 or local storage
 * @param file The file buffer to upload
 * @param fileName Original file name (used to determine extension)
 * @param contentType MIME type of the file
 * @returns URL of the uploaded file
 */
export async function uploadFile(file: Buffer, fileName: string, contentType: string): Promise<string> {
    // If AWS is not configured, fall back to local storage
    if (!isAwsConfigured || !s3Client) {
        // return uploadToLocalStorage(file, fileName)
    }

    try {
        // Generate a unique file name with original extension
        const fileExtension = fileName.split(".").pop() || ""
        const uniqueFileName = `${uuidv4()}.${fileExtension}`

        // Define the folder structure in S3
        const folderPath = determineFolder(contentType)
        const key = `${folderPath}/${uniqueFileName}`

        // Upload to S3
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME!,
            Key: key,
            Body: file,
            ContentType: contentType,
            ACL: "public-read", // Make the file publicly accessible
        })

        await s3Client.send(command)

        // Return the public URL
        return `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    } catch (error) {
        console.error("Error uploading to S3:", error)
        // Fall back to local storage if S3 upload fails
        // return uploadToLocalStorage(file, fileName)
    }
}

/**
 * Upload a file to local storage
 * @param file The file buffer to upload
 * @param fileName Original file name
 * @returns URL of the uploaded file
 */
async function uploadToLocalStorage(file: Buffer, fileName: string): Promise<string> {
    const { writeFile } = await import("fs/promises")
    const { join } = await import("path")

    // Create unique filename
    const fileExtension = fileName.split(".").pop() || ""
    const uniqueFileName = `${uuidv4()}.${fileExtension}`

    // Define upload directory and path
    const uploadDir = join(process.cwd(), "public", "uploads")
    const filePath = join(uploadDir, uniqueFileName)
    const fileUrl = `/uploads/${uniqueFileName}`

    // Write file to disk
    await writeFile(filePath, file)

    return fileUrl
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

