/** Rasterize SVG/icons and bound image size before adding a vision message. */
export async function assetPreview(data) {
    if (!data.mimeType.startsWith('image/'))
        throw new Error('The asset is not an image.');
    const bytes = Uint8Array.from(atob(data.base64), char => char.charCodeAt(0));
    const url = URL.createObjectURL(new Blob([bytes], { type: data.mimeType }));
    try {
        const image = new Image();
        image.src = url;
        await image.decode();
        if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40_000_000)
            throw new Error('Image is empty or exceeds the 40 megapixel preview limit.');
        const scale = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context)
            throw new Error('Image preview canvas is unavailable.');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        return { name: data.path, type: 'image/png', content: canvas.toDataURL('image/png') };
    }
    finally {
        URL.revokeObjectURL(url);
    }
}
