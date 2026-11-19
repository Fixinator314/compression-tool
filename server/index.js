const express = require("express");

const app = express();
const multer = require("multer");
const PORT = 5001;
const sharp = require("sharp");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, //10 MB
    files: 1,
  },
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Fixi's Compressor API is running" });
});

app.post("/api/compress/image", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please select an image.",
    });
  }

  const quality = Number(req.body.quality ?? 80);

  if (!Number.isInteger(quality) || quality < 10 || quality > 100) {
    return res.status(400).json({
      success: false,
      message: "Quality must be a whole number between 10 and 100.",
    });
  }

  try {
    const image = sharp(req.file.buffer, {
      limitInputPixels: 40_000_000, //40 Megapixels
    });

    const metadata = await image.metadata();

    if (!["jpeg", "png", "webp"].includes(metadata.format)) {
      return res.status(400).json({
        success: false,
        message: "Please upload a fuckin JPEG, PNG or WebP image.",
      });
    }

    if ((metadata.pages ?? 1) > 1) {
      return res.status(400).json({
        success: false,
        message: "Please select a still image for now.",
      });
    }

    const compressed = await image.rotate().webp({ quality }).toBuffer();

    // res.json({
    //   success: true,
    //   message: "Image processed successfully",
    //   name: req.file.originalname,
    //   originalSize: req.file.size,
    //   compressedSize: compressed.length,
    // });

    res.set("Cache-Control", "no-store");
    res.type("image/webp");
    res.send(compressed);
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: "Could not process this image. It may be damaged or too large.",
    });
  }
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "The file must be 10 MiB or smaller."
          : "Upload failed. Send one file using the image field.",
    });
  }

  console.error(err);
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server.",
  });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});
