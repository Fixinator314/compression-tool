import { useState } from "react";
import ImagePreview from "./ImagePreview";
import "./App.css";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);

  const [apiStatus, setApiStatus] = useState("");
  const [quality, setQuality] = useState(80);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    setSelectedFile(file ?? null);
  }

  async function checkApi() {
    setApiStatus("Connecting...");

    try {
      const response = await fetch("/api/health");

      if (!response.ok) {
        throw new Error("Server Request failed");
      }

      const data = await response.json();
      setApiStatus(data.message);
    } catch {
      setApiStatus("Could not connect. Check that the backend is running.");
    }
  }

  async function uploadImage() {
    if (!selectedFile) {
      setUploadStatus("Please select an image first.");
      return;
    }

    setIsUploading(true);
    setUploadStatus("Compressing...");

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("quality", String(quality));

      const response = await fetch("/api/compress/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Compression failed.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const baseName = selectedFile.name.replace(/\.[^.]+$/, "");

      link.href = url;
      link.download = `${baseName}-compressed.webp`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);

      const originalMB = (selectedFile.size / 1024 / 1024).toFixed(2);
      const compressedMB = (blob.size / 1024 / 1024).toFixed(2);

      setUploadStatus(
        `Original: ${originalMB} MB to Webp: ${compressedMB} MB. Download started.`,
      );

      // const data = await response.json();
      // if (!response.ok) {
      //   throw new Error(data.message || "Upload failed.");
      // }
      // setUploadStatus(`${data.message}: ${data.name}`);
    } catch (error) {
      setUploadStatus(error.message || "Could not upload the image.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="compressor">
      <h1>Fixi's Compressor</h1>
      <p>Select a file to compress</p>
      <button type="button" onClick={checkApi} className="api-check-btn">
        Check backend connection
      </button>
      <p role="status">{apiStatus}</p>
      <label htmlFor="image-upload">Choose an image</label>

      <input
        id="image-upload"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      <div className="quality-control">
        <label htmlFor="quality">Output Quality: {quality} </label>
        <input
          id="quality"
          type="range"
          min="10"
          max="100"
          step="1"
          value={quality}
          onChange={(event) => setQuality(Number(event.target.value))}
        />

        <p>
          Lower quality usually produces a smaller file. Higher quality
          preserves more detail.
        </p>
      </div>

      {selectedFile && (
        <section className="file-details">
          <h2>Selected image</h2>
          <ImagePreview file={selectedFile} />
          <p>
            <strong>Name: </strong> {selectedFile.name}
          </p>
          <p>
            <strong>Size: </strong>{" "}
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </section>
      )}

      <button
        type="button"
        onClick={uploadImage}
        disabled={!selectedFile || isUploading}
      >
        {isUploading ? "Compressing..." : "Compress image"}
      </button>
      <p role="status">{uploadStatus}</p>
    </main>
  );
}

export default App;
