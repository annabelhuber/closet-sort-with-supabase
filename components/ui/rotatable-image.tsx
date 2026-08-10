"use client";

import { useMemo, useState } from "react";

type RotatableImageProps = {
  src: string;
  alt: string;
  rotationDegrees?: number;
  className?: string;
  maxHeightClassName?: string;
};

/**
 * Renders an image in a frame that matches its true orientation.
 * When rotated 90°/270°, the frame swaps between landscape and portrait
 * so CSS rotation never clips the image.
 */
export function RotatableImage({
  src,
  alt,
  rotationDegrees = 0,
  className = "",
  maxHeightClassName = "max-h-72",
}: RotatableImageProps) {
  const [naturalSize, setNaturalSize] = useState({ width: 1, height: 1 });
  const normalizedRotation = ((rotationDegrees % 360) + 360) % 360;
  const swapped = normalizedRotation === 90 || normalizedRotation === 270;

  const frame = useMemo(() => {
    const width = swapped ? naturalSize.height : naturalSize.width;
    const height = swapped ? naturalSize.width : naturalSize.height;
    return { width, height };
  }, [naturalSize.height, naturalSize.width, swapped]);

  const isPortrait = frame.height > frame.width;

  return (
    <div
      className={`mx-auto flex w-full items-center justify-center overflow-visible rounded-md bg-muted ${maxHeightClassName} ${className}`}
      style={{
        aspectRatio: `${frame.width} / ${frame.height}`,
        maxWidth: isPortrait ? "16rem" : "100%",
      }}
    >
      <div className="relative h-full w-full overflow-visible">
        <img
          src={src}
          alt={alt}
          onLoad={(event) => {
            setNaturalSize({
              width: event.currentTarget.naturalWidth || 1,
              height: event.currentTarget.naturalHeight || 1,
            });
          }}
          className="absolute left-1/2 top-1/2 max-w-none origin-center transition-transform duration-200"
          style={{
            width: swapped
              ? `${(naturalSize.width / naturalSize.height) * 100}%`
              : "100%",
            height: "auto",
            transform: `translate(-50%, -50%) rotate(${normalizedRotation}deg)`,
          }}
        />
      </div>
    </div>
  );
}
