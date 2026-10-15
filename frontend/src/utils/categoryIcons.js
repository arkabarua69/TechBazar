// Shared category → image mapping used by the storefront CategoryShowcase and
// the Admin → Category manager. Categories are plain name strings configured in
// Admin (config.categories); each keyword resolves to one of the bundled
// category images, with a sensible default so every name still renders.

import phone from '../assets/images/Categories/phone.png';
import fashion from '../assets/images/Categories/fashion.png';
import electronics from '../assets/images/Categories/electronics.png';
import home from '../assets/images/Categories/home.png';
import travel from '../assets/images/Categories/travel.png';
import appliances from '../assets/images/Categories/appliances.png';
import furniture from '../assets/images/Categories/furniture.png';
import beauty from '../assets/images/Categories/beauty.png';
import grocery from '../assets/images/Categories/grocery.png';

export const CATEGORY_ICON_MAP = {
    mobile: phone, mobiles: phone, phone: phone, phones: phone, smartphone: phone, smartphones: phone,
    cosmetics: beauty, beauty: beauty,
    electronics: electronics, gadgets: electronics, laptop: electronics, laptops: electronics,
    furniture: furniture,
    watches: travel, watch: travel, travel: travel,
    decor: home, home: home, 'home & living': home,
    accessories: appliances, appliances: appliances, appliance: appliances,
    grocery: grocery, groceries: grocery,
    fashion: fashion, clothing: fashion, apparel: fashion,
};

export const DEFAULT_CATEGORY_IMAGE = electronics;

// Resolve an image for a category name (string or { name }).
export const categoryImage = (name) => {
    const key = String(typeof name === 'string' ? name : name?.name || '').trim().toLowerCase();
    return CATEGORY_ICON_MAP[key] || DEFAULT_CATEGORY_IMAGE;
};

export default categoryImage;
