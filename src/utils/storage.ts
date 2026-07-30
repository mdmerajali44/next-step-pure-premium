/**
 * Safe localStorage setItem helper that catches QuotaExceededError gracefully
 * and prevents uncaught DOMException app crashes.
 */
export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`[storage] localStorage quota exceeded when saving key "${key}". Data remains in memory and synced via backend API.`, error);
    return false;
  }
}

/**
 * Compresses an uploaded image file using HTML Canvas to keep base64 strings small (~50KB-100KB),
 * preventing browser storage quota limits and payload size issues.
 */
export function compressImageFile(file: File, callback: (base64: string) => void) {
  const reader = new FileReader();
  reader.onerror = () => {
    console.error("FileReader failed for image upload");
  };
  reader.onload = (event) => {
    const rawResult = event.target?.result as string;
    if (!rawResult) return;

    const img = new Image();
    img.onerror = () => {
      // Fallback to raw result if image format can't be rendered in canvas
      callback(rawResult);
    };
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Target max dimension 800px for optimal speed and file size
        const maxDimension = 800;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          callback(rawResult);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Progressively compress quality to stay under ~90KB
        const TARGET_BASE64_LENGTH = 120000;
        let quality = 0.75;
        let resultBase64 = canvas.toDataURL('image/jpeg', quality);
        
        if (resultBase64.length > TARGET_BASE64_LENGTH) {
          quality = 0.55;
          resultBase64 = canvas.toDataURL('image/jpeg', quality);
        }
        if (resultBase64.length > TARGET_BASE64_LENGTH) {
          quality = 0.35;
          resultBase64 = canvas.toDataURL('image/jpeg', quality);
        }
        if (resultBase64.length > TARGET_BASE64_LENGTH) {
          // Scale canvas down to 500px if still large
          const scale = 0.65;
          const smallCanvas = document.createElement('canvas');
          smallCanvas.width = Math.max(200, Math.round(width * scale));
          smallCanvas.height = Math.max(200, Math.round(height * scale));
          const smallCtx = smallCanvas.getContext('2d');
          if (smallCtx) {
            smallCtx.drawImage(img, 0, 0, smallCanvas.width, smallCanvas.height);
            resultBase64 = smallCanvas.toDataURL('image/jpeg', 0.45);
          }
        }
        
        callback(resultBase64);
      } catch (e) {
        callback(rawResult);
      }
    };
    img.src = rawResult;
  };
  reader.readAsDataURL(file);
}
