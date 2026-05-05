import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";

interface ConfirmationDialogProps {
  title: string | ReactNode;
  description: string | ReactNode;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  children?: ReactNode;
  content?: ReactNode;
  isDestructive?: boolean;
  isLoading?: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}

export function ConfirmationDialog({
  title,
  description,
  onConfirm,
  confirmText,
  cancelText,
  content,
  children,
  isDestructive = false,
  isLoading = false,
  onOpenChange,
  open: controlledOpen,
}: ConfirmationDialogProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const dialogOpen = isControlled ? controlledOpen : open;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      if (!isControlled) {
        setOpen(false);
      }
      handleOpenChange(false);
    }
  };

  const finalLoading = loading || isLoading;

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden sm:max-w-md flex flex-col gap-4 p-0">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pt-6">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
            {content && (
              <div className="flex flex-col items-center justify-center">
                {content}
              </div>
            )}
          </DialogHeader>
        </div>
        <section className="mt-auto w-full flex flex-wrap items-center justify-end gap-1 border-t bg-muted/50 px-4 py-3 sm:px-6 sm:py-4">
          <Button
            variant="outline"
            className="cursor-pointer"
            type="button"
            onClick={() => handleOpenChange(false)}
            disabled={finalLoading}
          >
            {cancelText || t("common.cancel")}
          </Button>
          <Button
            variant={isDestructive ? "destructive" : "default"}
            className="cursor-pointer"
            type="button"
            onClick={handleConfirm}
            disabled={finalLoading}
          >
            {finalLoading && <Spinner className="mr-2 h-4 w-4" />}
            {confirmText || t("common.confirm")}
          </Button>
        </section>
      </DialogContent>
    </Dialog>
  );
}
