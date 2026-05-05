import { useAuth } from "@/auth/AuthContext";
import ErrorBox from "@/components/common/error-box";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { apiUrl } from "@/config";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

export default function AddContactTab() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [submittedUsername, setSubmittedUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation();
  const { accessToken } = useAuth();

  const onSubmit = async () => {
    const requestedUsername = username.trim();

    setError(null);
    setIsSubmitting(true);
    setSubmittedUsername(requestedUsername);

    try {
      if (requestedUsername === "") {
        return;
      }

      const res = await fetch(apiUrl("/contacts/v1/request"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          username: requestedUsername,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("common.errors.too_many_requests");
        }

        const detail = data?.detail;
        throw new Error(detail);
      }

      toast.success(
        t("contacts.requested").replace("{{user}}", requestedUsername),
      );
      setUsername("");
      setSubmittedUsername("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "An error occured");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <p className="text-sm mb-2 text-foreground-muted">
        {t("contacts.add.description")}
      </p>
      <Field>
        <ButtonGroup>
          <Input
            placeholder={t("contacts.add.username")}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isSubmitting}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !isSubmitting) {
                onSubmit();
              }
            }}
          />
          <Button
            variant="outline"
            className="cursor-pointer"
            disabled={isSubmitting}
            onClick={onSubmit}
          >
            {t("contacts.add.action")}
          </Button>
        </ButtonGroup>
      </Field>

      {error && (
        <ErrorBox>
          <Trans i18nKey={error} values={{ user: submittedUsername }} />
        </ErrorBox>
      )}
    </>
  );
}
