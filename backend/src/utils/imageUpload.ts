import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload a base64 image to Cloudinary
 * @param base64Image - Base64 encoded image string (with or without data:image prefix)
 * @param folder - Folder name in Cloudinary (e.g., 'kayak-pickups', 'kayak-returns')
 * @returns Secure URL of the uploaded image
 */
export const uploadImage = async (base64Image: string, folder: string): Promise<string> => {
    try {
        // Ensure the base64 string has the data URI prefix
        let imageData = base64Image;
        if (!base64Image.startsWith('data:image')) {
            imageData = `data:image/jpeg;base64,${base64Image}`;
        }

        const result = await cloudinary.uploader.upload(imageData, {
            folder: folder,
            resource_type: 'image',
            transformation: [
                { width: 1200, height: 1200, crop: 'limit' }, // Limit max dimensions
                { quality: 'auto:good' } // Automatic quality optimization
            ]
        });

        return result.secure_url;
    } catch (error) {
        console.error('Error uploading image to Cloudinary:', error);
        throw new Error('Failed to upload image');
    }
};

/**
 * Delete an image from Cloudinary
 * @param imageUrl - Full Cloudinary URL of the image to delete
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
    try {
        // Extract public_id from URL
        // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
        const parts = imageUrl.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex === -1) {
            throw new Error('Invalid Cloudinary URL');
        }

        // Get everything after 'upload/v{version}/' and remove file extension
        const publicIdWithExtension = parts.slice(uploadIndex + 2).join('/');
        const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));

        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        // Don't throw - deletion is not critical
    }
};
