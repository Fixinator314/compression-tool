import { useEffect, useRef } from "react";

export default function ImagePreview({ file }) {
  const imageRef = useRef(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = imageRef.current;

    image.src = url;

    return () => {
      image.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <img
      ref={imageRef}
      className="image-preview"
      alt={`Preview of ${file.name}`}
    />
  );
}
