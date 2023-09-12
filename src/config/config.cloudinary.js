import cloudinary from 'cloudinary'
import dotenv from 'dotenv'

const cloudinaryV2 = cloudinary.v2
export default function cloudinaryConfig() {
    dotenv.config()
    cloudinaryV2.config({
        cloud_name: process.env.LMS_CLOUDINARY_CLOUD_NAME,
        api_key: process.env.LMS_CLOUDINARY_API_KEY,
        api_secret: process.env.LMS_CLOUDINARY_API_SECRET,
    })
    return cloudinaryV2
}