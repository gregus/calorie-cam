/**
 * Utility functions for optimizing images before upload
 */

/**
 * Optimizes an image by resizing and compressing it
 * @param file The original image file
 * @param maxWidth Maximum width of the optimized image
 * @param maxHeight Maximum height of the optimized image
 * @param quality JPEG quality (0-1)
 * @returns A promise that resolves to the optimized image as a Blob
 */
export async function optimizeImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.8,
): Promise<{ blob: Blob; dimensions: { width: number; height: number } }> {
  return new Promise((resolve, reject) => {
    // Create a FileReader to read the file
    const reader = new FileReader()

    // Set up the FileReader onload event
    reader.onload = (event) => {
      // Create an image element
      const img = new Image()

      // Set up the image onload event
      img.onload = () => {
        // Get the original dimensions
        let { width, height } = img

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width))
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * (maxHeight / height))
            height = maxHeight
          }
        }

        // Create a canvas element
        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        // Draw the image on the canvas
        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Convert the canvas to a Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not create blob"))
              return
            }

            // Resolve with the optimized image blob and dimensions
            resolve({
              blob,
              dimensions: { width, height },
            })
          },
          "image/jpeg",
          quality,
        )
      }

      // Set up the image onerror event
      img.onerror = () => {
        reject(new Error("Failed to load image"))
      }

      // Set the image source to the FileReader result
      img.src = event.target?.result as string
    }

    // Set up the FileReader onerror event
    reader.onerror = () => {
      reject(new Error("Failed to read file"))
    }

    // Read the file as a data URL
    reader.readAsDataURL(file)
  })
}

/**
 * Calculates the file size reduction as a percentage
 * @param originalSize Original file size in bytes
 * @param optimizedSize Optimized file size in bytes
 * @returns Percentage reduction as a string
 */
export function calculateSizeReduction(originalSize: number, optimizedSize: number): string {
  const reduction = ((originalSize - optimizedSize) / originalSize) * 100
  return `${Math.round(reduction)}%`
}

/**
 * Formats a file size in bytes to a human-readable string
 * @param bytes File size in bytes
 * @returns Formatted file size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
