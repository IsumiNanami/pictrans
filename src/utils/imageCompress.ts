/**
 * 压缩图片到指定尺寸和大小
 */
export async function compressImage(
  file: File,
  maxWidth = 2048,
  maxHeight = 2048,
  maxSizeMB = 3,
  quality = 0.85
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);

      let { width, height } = img;

      // 计算缩放比例
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法创建 canvas'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // 递归压缩直到满足大小要求
      const tryCompress = (q: number) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('压缩失败'));
              return;
            }

            const sizeMB = blob.size / (1024 * 1024);

            // 如果还是太大且质量还能降，继续压缩
            if (sizeMB > maxSizeMB && q > 0.3) {
              tryCompress(q - 0.1);
              return;
            }

            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          q
        );
      };

      tryCompress(quality);
    };

    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = URL.createObjectURL(file);
  });
}
