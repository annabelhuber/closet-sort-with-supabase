"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import {
  previewRedetectRegionAction,
  redetectRegionAction,
} from "@/app/(authenticated)/add-new/actions";
import { Button } from "@/components/ui/button";
import type { DetectedItem } from "@/types/database";

type Point = { x: number; y: number };

type ImageLayout = {
  offsetX: number;
  offsetY: number;
  displayWidth: number;
  displayHeight: number;
  naturalWidth: number;
  naturalHeight: number;
};

type PreviewCrop = {
  imageUrl: string;
  suggestedCategory: string | null;
  suggestedColor: string | null;
  detectionConfidence: number | null;
};

type RegionRedrawDialogProps = {
  open: boolean;
  sessionId: string;
  sourceImageUrl: string;
  replaceItemId?: string | null;
  onClose: () => void;
  onComplete: (result: {
    replacedItemId: string | null;
    items: Array<DetectedItem & { imageUrl: string }>;
  }) => void;
};

function measureImageLayout(
  container: HTMLElement,
  image: HTMLImageElement,
): ImageLayout | null {
  if (!image.naturalWidth || !image.naturalHeight) {
    return null;
  }

  const containerRect = container.getBoundingClientRect();
  const scale = Math.min(
    containerRect.width / image.naturalWidth,
    containerRect.height / image.naturalHeight,
  );
  const displayWidth = image.naturalWidth * scale;
  const displayHeight = image.naturalHeight * scale;
  const offsetX = (containerRect.width - displayWidth) / 2;
  const offsetY = (containerRect.height - displayHeight) / 2;

  return {
    offsetX,
    offsetY,
    displayWidth,
    displayHeight,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
  };
}

export function RegionRedrawDialog({
  open,
  sessionId,
  sourceImageUrl,
  replaceItemId = null,
  onClose,
  onComplete,
}: RegionRedrawDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const previewRequestId = useRef(0);
  const [points, setPoints] = useState<Point[]>([]);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [layout, setLayout] = useState<ImageLayout | null>(null);
  const [sensitivity, setSensitivity] = useState(50);
  const [previewCrops, setPreviewCrops] = useState<PreviewCrop[]>([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const refreshLayout = useCallback(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    if (!container || !image) {
      return;
    }
    setLayout(measureImageLayout(container, image));
  }, []);

  const clearPreview = useCallback(() => {
    previewRequestId.current += 1;
    setPreviewCrops([]);
    setPreviewError(null);
    setIsPreviewing(false);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    setPoints([]);
    setClosed(false);
    setError(null);
    setLayout(null);
    setSensitivity(50);
    clearPreview();
  }, [open, sourceImageUrl, replaceItemId, clearPreview]);

  useEffect(() => {
    if (!open) {
      return;
    }

    refreshLayout();
    window.addEventListener("resize", refreshLayout);
    return () => window.removeEventListener("resize", refreshLayout);
  }, [open, refreshLayout]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isPending) {
        onClose();
      }
      if (event.key === "Enter" && points.length >= 3 && !closed) {
        event.preventDefault();
        setClosed(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isPending, onClose, points.length, closed]);

  useEffect(() => {
    if (!open || !closed || points.length < 3 || isPending) {
      return;
    }

    const requestId = ++previewRequestId.current;
    const timeoutId = window.setTimeout(async () => {
      setIsPreviewing(true);
      setPreviewError(null);
      try {
        const result = await previewRedetectRegionAction({
          sessionId,
          points,
          sensitivity,
        });
        if (previewRequestId.current !== requestId) {
          return;
        }
        setPreviewCrops(result.items);
        if (result.items.length === 0) {
          setPreviewError(
            "No clothing detected at this sensitivity. Try raising it.",
          );
        }
      } catch (previewFailure) {
        if (previewRequestId.current !== requestId) {
          return;
        }
        setPreviewCrops([]);
        setPreviewError(
          previewFailure instanceof Error
            ? previewFailure.message
            : "Failed to preview crop.",
        );
      } finally {
        if (previewRequestId.current === requestId) {
          setIsPreviewing(false);
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [open, closed, points, sensitivity, sessionId, isPending]);

  const clientToImagePoint = useCallback(
    (clientX: number, clientY: number): Point | null => {
      const container = containerRef.current;
      const currentLayout = layout;
      if (!container || !currentLayout) {
        return null;
      }

      const containerRect = container.getBoundingClientRect();
      const localX = clientX - containerRect.left - currentLayout.offsetX;
      const localY = clientY - containerRect.top - currentLayout.offsetY;

      if (
        localX < 0 ||
        localY < 0 ||
        localX > currentLayout.displayWidth ||
        localY > currentLayout.displayHeight
      ) {
        return null;
      }

      return {
        x: (localX / currentLayout.displayWidth) * currentLayout.naturalWidth,
        y: (localY / currentLayout.displayHeight) * currentLayout.naturalHeight,
      };
    },
    [layout],
  );

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isPending || closed) {
      return;
    }
    const point = clientToImagePoint(event.clientX, event.clientY);
    if (!point) {
      return;
    }
    setPoints((current) => [...current, point]);
  };

  const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (points.length >= 3) {
      setClosed(true);
    }
  };

  const runDetection = () => {
    if (points.length < 3) {
      setError("Draw at least 3 points around the clothing item.");
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        const result = await redetectRegionAction({
          sessionId,
          points,
          replaceItemId,
          sensitivity,
        });
        onComplete(result);
        onClose();
      } catch (runError) {
        setError(
          runError instanceof Error
            ? runError.message
            : "Failed to re-run detection.",
        );
      }
    });
  };

  if (!open) {
    return null;
  }

  const overlayPoints =
    layout == null
      ? []
      : points.map((point) => ({
          x:
            layout.offsetX +
            (point.x / layout.naturalWidth) * layout.displayWidth,
          y:
            layout.offsetY +
            (point.y / layout.naturalHeight) * layout.displayHeight,
        }));

  const polygonPoints = overlayPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const canPreview = closed && points.length >= 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex max-h-[95vh] w-full max-w-5xl flex-col gap-4 overflow-y-auto rounded-lg bg-background p-4 shadow-lg">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">
            {replaceItemId ? "Fix crop" : "Add missing item"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Click to place points around the clothing. Close the shape, then
            adjust sensitivity to preview the crop before saving.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Source</p>
            <div
              ref={containerRef}
              className="relative min-h-[240px] w-full cursor-crosshair overflow-hidden rounded-md bg-muted md:min-h-[320px]"
              onClick={handleClick}
              onDoubleClick={handleDoubleClick}
            >
              {/* Signed storage URLs are dynamic; native img avoids Next optimizer issues. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={sourceImageUrl}
                alt="Source upload"
                className="h-full max-h-[50vh] w-full object-contain select-none md:max-h-[60vh]"
                draggable={false}
                onLoad={refreshLayout}
              />
              {overlayPoints.length > 0 ? (
                <svg className="pointer-events-none absolute inset-0 h-full w-full">
                  {closed && overlayPoints.length >= 3 ? (
                    <polygon
                      points={polygonPoints}
                      fill="rgba(59, 130, 246, 0.25)"
                      stroke="rgb(37, 99, 235)"
                      strokeWidth="2"
                    />
                  ) : (
                    <polyline
                      points={polygonPoints}
                      fill="none"
                      stroke="rgb(37, 99, 235)"
                      strokeWidth="2"
                    />
                  )}
                  {overlayPoints.map((point, index) => (
                    <circle
                      key={`${point.x}-${point.y}-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="rgb(37, 99, 235)"
                    />
                  ))}
                </svg>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Crop preview</p>
              {isPreviewing ? (
                <span className="text-xs text-muted-foreground">Updating…</span>
              ) : null}
            </div>
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-md bg-muted p-3 md:min-h-[320px]">
              {!canPreview ? (
                <p className="px-4 text-center text-sm text-muted-foreground">
                  Close the shape to preview the detected crop.
                </p>
              ) : previewCrops.length > 0 ? (
                <div className="flex w-full flex-wrap items-start justify-center gap-3">
                  {previewCrops.map((crop, index) => (
                    <div
                      key={`${crop.imageUrl.slice(0, 48)}-${index}`}
                      className="flex max-w-full flex-col items-center gap-1"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={crop.imageUrl}
                        alt={
                          crop.suggestedCategory
                            ? `Preview ${crop.suggestedCategory}`
                            : `Crop preview ${index + 1}`
                        }
                        className="max-h-[45vh] max-w-full object-contain"
                      />
                      {crop.suggestedCategory ? (
                        <p className="text-xs text-muted-foreground">
                          {crop.suggestedCategory}
                          {crop.detectionConfidence != null
                            ? ` · ${Math.round(crop.detectionConfidence * 100)}%`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-4 text-center text-sm text-muted-foreground">
                  {previewError ??
                    (isPreviewing
                      ? "Detecting crop…"
                      : "No crop to show yet.")}
                </p>
              )}
            </div>
          </div>
        </div>

        {error ? <p className="text-sm text-red-500">{error}</p> : null}
        {canPreview && previewError && previewCrops.length > 0 ? (
          <p className="text-sm text-red-500">{previewError}</p>
        ) : null}

        <div className="grid gap-2">
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="detection-sensitivity"
              className="text-sm font-medium"
            >
              Detection sensitivity
            </label>
            <span className="text-sm text-muted-foreground">{sensitivity}</span>
          </div>
          <input
            id="detection-sensitivity"
            type="range"
            min={0}
            max={100}
            step={1}
            value={sensitivity}
            disabled={isPending || !canPreview}
            onChange={(event) => setSensitivity(Number(event.target.value))}
            className="w-full accent-foreground"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Less sensitive</span>
            <span>More sensitive</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isPending || points.length === 0}
            onClick={() => {
              setPoints((current) => current.slice(0, -1));
              setClosed(false);
              clearPreview();
            }}
          >
            Undo
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || points.length === 0}
            onClick={() => {
              setPoints([]);
              setClosed(false);
              clearPreview();
            }}
          >
            Clear
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending || points.length < 3 || closed}
            onClick={() => setClosed(true)}
          >
            Close shape
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isPending || points.length < 3 || isPreviewing}
            onClick={runDetection}
          >
            {isPending ? "Saving..." : "Save crop"}
          </Button>
        </div>
      </div>
    </div>
  );
}
