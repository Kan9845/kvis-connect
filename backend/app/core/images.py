import io

from PIL import Image, ImageOps


def compress_image(fileobj, max_dim: int, quality: int = 82) -> io.BytesIO:
    """Downscale to fit within max_dim (preserving aspect) and re-encode as WebP.

    Cuts stored/served bytes ~90% vs raw phone photos, which is what drives
    Supabase Cached Egress. Only shrinks - never upscales small images.
    """
    img = Image.open(fileobj)
    img = ImageOps.exif_transpose(img)  # respect phone orientation before dropping EXIF

    if img.mode in ("P", "LA"):
        img = img.convert("RGBA")
    elif img.mode not in ("RGB", "RGBA"):
        img = img.convert("RGB")

    img.thumbnail((max_dim, max_dim))  # in-place, keeps aspect, only downscales

    buf = io.BytesIO()
    img.save(buf, format="WEBP", quality=quality, method=6)
    buf.seek(0)
    return buf


if __name__ == "__main__":
    # ponytail self-check: a big image must come out smaller and bounded.
    src = io.BytesIO()
    Image.new("RGB", (4000, 3000), "red").save(src, format="PNG")
    raw_len = src.tell()
    src.seek(0)

    out = compress_image(src, max_dim=512)
    w, h = Image.open(out).size
    assert max(w, h) == 512, (w, h)
    out.seek(0, io.SEEK_END)
    assert out.tell() < raw_len, "compressed should be smaller than source"
    print("ok:", w, "x", h, "->", out.tell(), "bytes")
