import { useState } from "react";
import { useTranslation } from "react-i18next";

interface HiddenComponentProps {
  text: string;
}
export default function HiddenComponent({ text }: HiddenComponentProps) {
  const { t } = useTranslation();
  const [shown, setShown] = useState(false);

  const hidden_text = text.replace(/[\p{L}\p{N}]/gu, "•");

  return (
    <div className="inline-flex gap-1 items-center">
      <p>{shown ? text : hidden_text}</p>
      <a
        onClick={() => setShown(!shown)}
        className="hover:underline cursor-pointer"
      >
        {shown ? t("common.hide") : t("common.show")}
      </a>
    </div>
  );
}
