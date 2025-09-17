import logo from './logo.png'
import add_icon from './add_icon.png'
import order_icon from './order_icon.png'
import item_list from './item_list.png'
import discount_img from './discount_img.png'
import profile_image from './profile_image.png'
import upload_area from './upload_area.png'
import parcel_icon from './parcel_icon.png'

// Make sure URL doesn't end with a slash to prevent double slashes
const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const url = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
export const currency = '₹'

export const assets ={
    logo,
    add_icon,
    order_icon,
    item_list,
    discount_img,
    profile_image,
    upload_area,
    parcel_icon,
    food_placeholder: 'https://placehold.co/400x300/orange/white?text=Food+Image'
}

