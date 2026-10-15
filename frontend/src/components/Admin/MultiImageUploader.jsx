/**
 * MultiImageUploader — upload several product images with the same widget
 * used everywhere else in the admin (ImgBBUploader: Upload File / Paste URL).
 *
 * Each uploaded/pasted URL is appended to `value`. Thumbnails can be removed.
 * Images are hosted on ImgBB (or pasted as an existing URL) BEFORE the product
 * is submitted, so the form just submits a list of URLs.
 *
 * Props:
 *   label    {string}   — field label (default "Images")
 *   value    {string[]} — array of hosted image URLs
 *   onChange {function} — called with the next array of URLs
 *   max      {number}   — optional max number of images
 */
import { useState } from 'react';
import ImgBBUploader from './ImgBBUploader';

const MultiImageUploader = ({ label = 'Images', value = [], onChange, max = 8 }) => {
    const [resetKey, setResetKey] = useState(0);
    const list = Array.isArray(value) ? value : [];

    const addImage = (url) => {
        if (!url) return;
        const clean = String(url).trim();
        if (!clean || list.includes(clean)) return;
        onChange([...list, clean]);
        setResetKey((k) => k + 1); // remount the uploader so it's ready for the next image
    };

    const removeImage = (index) => onChange(list.filter((_, i) => i !== index));

    const atMax = max && list.length >= max;

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-gray-500">{label}</label>
                <span className="text-[11px] text-gray-400">
                    {list.length}{max ? `/${max}` : ''}
                </span>
            </div>

            {list.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {list.map((url, i) => (
                        <div
                            key={`${url}-${i}`}
                            className="relative group rounded-lg border border-gray-200 bg-gray-50 overflow-hidden"
                        >
                            <img
                                src={url}
                                alt="Product"
                                draggable="false"
                                className="w-full h-20 object-contain"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(i)}
                                title="Remove image"
                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/90 border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {!atMax ? (
                <ImgBBUploader
                    key={resetKey}
                    label="Add image"
                    currentUrl=""
                    onUploaded={addImage}
                    className="border border-dashed border-gray-200 rounded-xl p-3 bg-gray-50"
                />
            ) : (
                <p className="text-xs text-gray-400">Maximum {max} images reached.</p>
            )}
        </div>
    );
};

export default MultiImageUploader;
