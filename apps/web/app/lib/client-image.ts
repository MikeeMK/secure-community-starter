'use client';

const MAX_DIMENSION = 1280;
const TARGET_BYTES = 140 * 1024;
const MIN_QUALITY = 0.45;

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image illisible.'));
    image.src = url;
  });
}

function fitDimensions(width: number, height: number) {
  if (width <= MAX_DIMENSION && height <= MAX_DIMENSION) {
    return { width, height };
  }

  const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Compression impossible.'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality,
    );
  });
}

function toJpegName(filename: string) {
  const base = filename.replace(/\.[^.]+$/, '');
  return `${base || 'photo'}.jpg`;
}

export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);
    let { width, height } = fitDimensions(image.naturalWidth, image.naturalHeight);
    let quality = 0.82;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas indisponible.');
    }

    let blob: Blob | null = null;

    while (true) {
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, width, height);
      blob = await canvasToBlob(canvas, quality);

      if (blob.size <= TARGET_BYTES) {
        break;
      }

      if (quality > MIN_QUALITY) {
        quality = Math.max(MIN_QUALITY, quality - 0.08);
        continue;
      }

      if (width <= 900 && height <= 900) {
        break;
      }

      width = Math.max(900, Math.round(width * 0.88));
      height = Math.max(900, Math.round(height * 0.88));
    }

    return new File([blob], toJpegName(file.name), {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
