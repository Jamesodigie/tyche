/** Square-crops and shrinks a photo on the device (≈30–80 KB) so uploads are quick on mobile data. */
export async function squareJpeg(file: File, size = 512): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose a photo (JPG or PNG).");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((ok, bad) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => bad(new Error("We couldn't read that photo. Try a JPG or PNG."));
      i.src = url;
    });
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    const c = document.createElement("canvas");
    c.width = c.height = Math.min(size, s);
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, c.width, c.height);
    return await new Promise<Blob>((ok, bad) => c.toBlob((b) => (b ? ok(b) : bad(new Error("We couldn't process that photo."))), "image/jpeg", 0.85));
  } finally {
    URL.revokeObjectURL(url);
  }
}
