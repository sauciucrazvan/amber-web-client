import { useAuth } from "@/auth/AuthContext";
import UserAvatar from "@/components/common/user-avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { apiUrl } from "@/config";
import { Ban, X } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";
import { dispatchContactsEvent } from "@/lib/contact-events";
import { Spinner } from "@/components/ui/spinner";
import { useChat } from "../home/chat";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";

interface UserProfileProps {
  username: string;
  trigger: ReactNode;
}

type Profile = {
  id: number;
  username: string;
  full_name: string;
  avatar_url?: string | null;
  bio?: string;
  online: boolean;
  verified: boolean;
  disabled: boolean;
  registered_at?: string | null;
  last_active_at?: string | null;
};

export default function UserProfile({ username, trigger }: UserProfileProps) {
  const { t } = useTranslation();
  const { isAuthenticated, accessToken } = useAuth();
  const { activeChat, closeChat } = useChat();
  const formatMonthYear = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  };

  const [open, setOpen] = useState<boolean>(false);

  const {
    data: user,
    error: error,
    isLoading: isLoading,
  } = useSWR<Profile>(
    isAuthenticated && open ? "/contacts/v1/profile/" + username : null,
  );
  const shouldCloseChat = activeChat?.otherUser.username === username;

  const onBlock = async () => {
    try {
      const res = await fetch(apiUrl("/contacts/v1/block"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          username: username,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        toast.success(t(data.message).replace("{{user}}", username));
        await mutate("/contacts/v1/list");
        dispatchContactsEvent({
          type: "contacts",
          event: "contact.removed",
          payload: {
            username,
          },
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "An error occured");
    } finally {
      if (shouldCloseChat) {
        closeChat();
      }
      setOpen(false);
    }
  };

  const onRemove = async () => {
    try {
      const res = await fetch(apiUrl("/contacts/v1/remove"), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          username: username,
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        toast.success(t(data.message).replace("{{user}}", username));
        await mutate("/contacts/v1/list");
        dispatchContactsEvent({
          type: "contacts",
          event: "contact.removed",
          payload: {
            username,
          },
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "An error occured");
    } finally {
      if (shouldCloseChat) {
        closeChat();
      }
      setOpen(false);
    }
  };

  if (!isAuthenticated) return <>Unauthorized.</>;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>

        <DialogContent className="sm:max-w-85 min-h-25 max-h-100 flex flex-col items-start justify-start">
          <DialogHeader className="w-full">
            {open && !isLoading && user ? (
              <>
                <DialogTitle className="w-full flex flex-col items-center justify-center gap-3 text-center">
                  <UserAvatar
                    full_name={user.full_name}
                    username={user.username}
                    isOnline={user.online}
                    avatarUrl={user.avatar_url}
                    size="xl"
                  />
                  <div className="flex flex-col items-center gap-0">
                    <h3 className="text-lg leading-tight">{user.full_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                </DialogTitle>
                <DialogDescription className="w-full">
                  <div className="w-full mt-3 rounded-md border border-border/60 px-4 py-3">
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      {t("profile.bio.title")}
                    </div>
                    <div className="text-sm text-foreground/80 whitespace-pre-wrap wrap-break-word">
                      {(user.bio ?? "").trim() || t("profile.bio.empty")}
                    </div>
                  </div>
                </DialogDescription>
              </>
            ) : (
              <DialogTitle className="sr-only">
                {t("contacts.profile", "Profile")}
              </DialogTitle>
            )}
          </DialogHeader>

          {open && isLoading && !error && (
            <div className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Spinner />
            </div>
          )}

          {open && !isLoading && user && (
            <>
              <section className="w-full flex flex-col gap-2 pt-3 text-sm">
                <div className="flex flex-row justify-between gap-1">
                  <span className="text-muted-foreground">
                    {t("stats.member_since", "Member since")}
                  </span>
                  <span>{formatMonthYear(user.registered_at) ?? "—"}</span>
                </div>
                <div className="flex flex-row  justify-between gap-1">
                  <span className="text-muted-foreground">
                    {t("stats.last_active", "Last active")}
                  </span>
                  <span>
                    {user.last_active_at
                      ? formatRelativeTime(t, user.last_active_at)
                      : "—"}
                  </span>
                </div>
              </section>

              <section className="w-full inline-flex items-center justify-center gap-2 pt-4">
                <ConfirmationDialog
                  title={t("contacts.removeConfirm.title")}
                  description={t("contacts.removeConfirm.description", {
                    user: user.full_name || user.username,
                  })}
                  onConfirm={onRemove}
                  confirmText={t("common.remove")}
                  isDestructive
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                  >
                    <X className="size-3.5" /> {t("contacts.remove")}
                  </Button>
                </ConfirmationDialog>

                <ConfirmationDialog
                  title={t("contacts.blockConfirm.title")}
                  description={t("contacts.blockConfirm.description", {
                    user: user.full_name || user.username,
                  })}
                  onConfirm={onBlock}
                  confirmText={t("common.block")}
                  isDestructive
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                  >
                    <Ban className="size-3.5" /> {t("contacts.block")}
                  </Button>
                </ConfirmationDialog>
              </section>
            </>
          )}

          {error && (
            <p className="text-red-500">
              <Trans i18nKey={error.message} values={{ user: username }} />
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
