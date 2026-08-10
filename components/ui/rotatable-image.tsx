"use client";

type RotatableImageProps = {
  src: string;
  alt: string;
  rotationDegrees?: number;
  className?: string;
};

/**
 * Shows an image inside a fixed square frame.
 * Rotation is visual only (CSS) and stays fully contained — no spill outside the card.
 * Landscape vs portrait source images both fit via object-contain; 90°/270° swaps
 * which side is longer visually without changing the frame size.
 */
export function RotatableImage({
  src,
  alt,
  rotationDegrees = 0,
  className = "",
}: RotatableImageProps) {
  const normalizedRotation = ((rotationDegrees % 360) + 360) % 360;

  return (
    <div
      className={`mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-md bg-muted ${className}`}
    >
      <div className="flex h-full w-full items-center justify-center p-2">
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full object-contain transition-transform duration-200"
          style={{ transform: `rotate(${normalizedRotation}deg)` }}
        />
      </div>
    </div>
  );
}
