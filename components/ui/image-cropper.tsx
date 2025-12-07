"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImage: string) => void;
  aspectRatio?: number;
  allowSkip?: boolean;
}

/**
 * Helper function to create an image element from a source
 */
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

/**
 * Helper function to get the cropped image as a base64 string
 */
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  // Set canvas size to match the cropped area
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // Convert canvas to base64
  return canvas.toDataURL("image/jpeg", 0.95);
}

export function ImageCropper({
  open,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 9 / 16,
  allowSkip = true,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;

    setIsCropping(true);
    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
      onClose();
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsCropping(false);
    }
  };

  const handleSkip = () => {
    onCropComplete(imageSrc);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Crop Image</DialogTitle>
        </VisuallyHidden>
        
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Crop & Resize Image</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Adjust the image to fit portrait 9:16 ratio
            </p>
          </div>

          {/* Cropper Area */}
          <div className="relative flex-1 bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropCompleteCallback}
            />
          </div>

          {/* Zoom Control */}
          <div className="px-6 py-4 border-t bg-white">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium whitespace-nowrap">Zoom</span>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <DialogFooter className="px-6 py-4 border-t bg-gray-50">
            <div className="flex justify-between w-full gap-3">
              <div>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="rounded-full"
                >
                  Cancel
                </Button>
              </div>
              <div className="flex gap-3">
                {allowSkip && (
                  <Button
                    variant="outline"
                    onClick={handleSkip}
                    className="rounded-full border-[#31A7AC] text-[#31A7AC] hover:bg-[#31A7AC]/10"
                  >
                    Skip Crop
                  </Button>
                )}
                <Button
                  onClick={handleCrop}
                  disabled={isCropping}
                  className="rounded-full bg-[#FA6E80] hover:bg-[#FA6E80]/90"
                >
                  {isCropping ? "Cropping..." : "Apply Crop"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
