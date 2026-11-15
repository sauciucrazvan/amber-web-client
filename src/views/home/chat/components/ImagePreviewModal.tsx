import {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
} from "@radix-ui/react-dialog";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Download, X } from "lucide-react";
import { memo } from "react";

interface ImagePreviewModalProps {
  fileUrl: string;
  fileName: string;
  downloadFile: () => Promise<void>;
}

export const ImagePreviewModal = memo(
  ({ fileUrl, fileName, downloadFile }: ImagePreviewModalProps) => {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            className="cursor-pointer relative rounded overflow-hidden border bg-black/5 max-h-80 flex items-center justify-center focus:outline-none w-full"
          >
            <img
              src={fileUrl}
              alt={fileName}
              className="object-contain max-w-full max-h-80 w-auto h-auto"
              loading="lazy"
            />
          </button>
        </DialogTrigger>

        <DialogPortal>
          <DialogOverlay className="fixed inset-0 bg-black/40 backdrop-blur-md z-100 transition-all animate-fade-in" />
          <DialogContent className="fixed inset-0 z-101 flex items-center justify-center w-screen h-screen overflow-hidden focus:outline-none">
            <div className="absolute top-4 right-4 z-110 flex items-center gap-2">
              <button
                type="button"
                className="text-white/70 hover:text-white bg-black/40 hover:bg-black/60 p-2.5 rounded-full transition-colors cursor-pointer focus:outline-none"
                onClick={(e) => {
                  e.stopPropagation();
                  void downloadFile();
                }}
              >
                <Download className="h-5 w-5" />
              </button>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="text-white/70 hover:text-white bg-black/40 hover:bg-black/60 p-2.5 rounded-full transition-colors cursor-pointer focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              </DialogTrigger>
            </div>

            <div className="w-screen h-screen block select-none touch-none bg-transparent">
              <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={8}
                centerOnInit={true}
                limitToBounds={true}
                doubleClick={{ mode: "toggle" }}
                wheel={{ step: 0.1 }}
                panning={{ velocityDisabled: true }}
                customTransform={(x, y, scale) =>
                  `matrix3d(${scale}, 0, 0, 0, 0, ${scale}, 0, 0, 0, 0, 1, 0, ${x}, ${y}, 0, 1)`
                }
              >
                <TransformComponent
                  wrapperClass="!w-screen !h-screen bg-transparent cursor-grab active:cursor-grabbing"
                  contentClass="!w-screen !h-screen flex items-center justify-center"
                >
                  <img
                    src={fileUrl}
                    alt={fileName}
                    className="max-w-[95vw] max-h-[95vh] w-full h-full object-contain pointer-events-none transform-gpu will-change-transform backface-hidden perspective-[1000px]"
                  />
                </TransformComponent>
              </TransformWrapper>
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    );
  },
);

ImagePreviewModal.displayName = "ImagePreviewModal";
