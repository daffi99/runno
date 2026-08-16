/**
 * Utility to optimize and compress screenshot images before saving to Database/Storage.
 * Reduces 5MB-10MB raw screenshots to ~150KB-250KB while preserving sharp text and number readability.
 */
export async function compressImage(fileOrBase64, maxWidth = 1080, maxHeight = 2400, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let width = img.naturalWidth || img.width;
            let height = img.naturalHeight || img.height;
            // Handle long/tall scrolling screenshots (Huawei Health / Garmin)
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                // Fallback to original if canvas context is unavailable
                resolve(typeof fileOrBase64 === 'string' ? fileOrBase64 : '');
                return;
            }
            // Smooth rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            // Export as optimized JPEG
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
        };
        img.onerror = (err) => {
            console.warn('Image compression fallback:', err);
            if (typeof fileOrBase64 === 'string') {
                resolve(fileOrBase64);
            }
            else {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result);
                reader.onerror = reject;
                reader.readAsDataURL(fileOrBase64);
            }
        };
        if (typeof fileOrBase64 === 'string') {
            img.src = fileOrBase64;
        }
        else {
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target?.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(fileOrBase64);
        }
    });
}
