import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { isValidElement } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  children?: React.ReactNode;
}

export default function TermsView({ children }: Props) {
  const { t } = useTranslation();

  const contentText = t("legal.terms.content").replace(/\\n/g, "\n");
  const contentLines = contentText
    .split("\n")
    .map((line, idx) => <div key={idx}>{line}</div>);

  const content = (
    <>
      <DialogHeader>
        <DialogTitle>{t("legal.terms.title")}</DialogTitle>
        <DialogDescription>{t("legal.terms.description")}</DialogDescription>
      </DialogHeader>
      <div className="text-sm text-muted-foreground leading-relaxed">
        {contentLines}
      </div>
    </>
  );

  if (!children) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-4 p-6">{content}</main>
    );
  }

  const trigger = isValidElement(children) ? (
    children
  ) : (
    <span className="cursor-pointer underline underline-offset-4 hover:text-primary">
      {children}
    </span>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[85vh] overflow-hidden sm:max-w-125 flex flex-col gap-4 p-0">
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
