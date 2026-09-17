const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

/**
 * Converts a base64 Data URL to a native Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Processes an uploaded image file for staff profile pictures / DP:
 * - Center-crops and scales to a square avatar (default 256x256)
 * - Compresses to JPEG data URL (~15-30 KB)
 */
export function processAvatarImage(file: File, targetSize = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    // Check MIME type or common image extensions (handles Windows edge cases)
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|jfif)$/i.test(file.name);
    if (!isImage) {
      return reject(new Error('Please select a valid image file (JPG, PNG, WebP).'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas context not available.'));
        }

        // Center-crop (aspect-ratio cover) calculation
        const sourceWidth = img.width;
        const sourceHeight = img.height;
        const minDim = Math.min(sourceWidth, sourceHeight);
        const sourceX = (sourceWidth - minDim) / 2;
        const sourceY = (sourceHeight - minDim) / 2;

        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          minDim,
          minDim,
          0,
          0,
          targetSize,
          targetSize
        );

        // Convert to lightweight JPEG data URL (~15-25 KB)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads directly to Supabase Storage bucket 'staff-avatars'
 * and returns the public CDN image URL.
 */
export async function uploadOrProcessAvatar(file: File, userId = 'user'): Promise<string> {
  // 1. Process and compress image to a square 256x256 JPEG
  const dataUrl = await processAvatarImage(file, 256);

  // 2. Upload directly to Supabase Storage bucket 'staff-avatars'
  if (SUPABASE_URL && SUPABASE_KEY) {
    try {
      const blob = dataUrlToBlob(dataUrl);
      const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${safeUserId}-${Date.now()}.jpg`;
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/staff-avatars/${filename}`;

      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'true',
        },
        body: blob,
      });

      if (res.ok) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/staff-avatars/${filename}`;
        console.log('✅ Supabase Storage upload success:', publicUrl);
        return publicUrl;
      } else {
        const errJson = await res.json().catch(() => null);
        console.warn('⚠️ Supabase Storage upload notice:', errJson);
      }
    } catch (e) {
      console.warn('⚠️ Supabase Storage network notice:', e);
    }
  }

  // Fallback: Return optimized data URL
  return dataUrl;
}
