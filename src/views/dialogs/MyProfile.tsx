import { useAuth } from "@/auth/AuthContext";
import { useAccount } from "@/account/AccountContext";
import UserAvatar from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiUrl } from "@/config";
import { Pencil, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import ChangeName from "../settings/tabs/dialogs/ChangeName";
import type { AccountMe } from "@/account/AccountContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MyProfileProps {
  trigger: ReactNode;
}

async function readErrorMessage(res: Response) {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
  } catch {
    return `Request failed (${res.status})`;
  }
  return `Request failed (${res.status})`;
}

export default function MyProfile({ trigger }: MyProfileProps) {
  const { t } = useTranslation();
  const { isAuthenticated, authFetch } = useAuth();
  const { account, error, isLoading } = useAccount();
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
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioDraft, setBioDraft] = useState("");
  const [bioErrorKey, setBioErrorKey] = useState<string | null>(null);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const user = account as AccountMe | null;

  useEffect(() => {
    if (!open || !user) return;
    setBioDraft(user.bio ?? "");
    setBioErrorKey(null);
    setIsEditingBio(false);
  }, [open, user]);

  const saveBio = async () => {
    if (!user) return;
    setBioErrorKey(null);
    setIsSavingBio(true);

    try {
      const res = await authFetch(apiUrl("/account/v1/modify/bio"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          new_bio: bioDraft,
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("common.errors.too_many_requests");
        }
        throw new Error(await readErrorMessage(res));
      }

      setIsEditingBio(false);
    } catch (e) {
      setBioErrorKey(e instanceof Error ? e.message : "common.info");
    } finally {
      setIsSavingBio(false);
    }
  };

  const changeAvatar = async (ev: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = ev.target.files?.[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);

    setSelectedAvatarFile(selectedFile);
    ev.target.value = "";
  };

  const uploadAvatar = async () => {
    if (!selectedAvatarFile) return;

    setBioErrorKey(null);
    setIsUploadingAvatar(true);

    try {
      const body = new FormData();
      body.append("file", selectedAvatarFile);

      const res = await authFetch(apiUrl("/account/v1/upload/avatar"), {
        method: "POST",
        body,
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("common.errors.too_many_requests");
        }
        throw new Error(await readErrorMessage(res));
      }

      toast.success(t("settings.account.avatar.uploaded"));
      setSelectedAvatarFile(null);
      setPreviewUrl(null);
    } catch (e) {
      setBioErrorKey(e instanceof Error ? e.message : "common.info");
      toast.error(
        e instanceof Error ? t(e.message) : t("settings.account.avatar.error"),
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (!isAuthenticated) return <>Unauthorized.</>;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>

        <DialogContent className="sm:max-w-85 min-h-25 max-h-100 flex flex-col items-start justify-start">
          {!isLoading && user && (
            <>
              <DialogHeader className="w-full">
                <DialogTitle className="w-full flex flex-col items-center justify-center gap-3 text-center">
                  <label
                    htmlFor="avatar-upload-input"
                    className="relative cursor-pointer group/avatar"
                  >
                    <UserAvatar
                      full_name={user.full_name}
                      username={user.username}
                      avatarUrl={user.avatar_url}
                      size="xl"
                    />
                    <span className="pointer-events-none absolute inset-0 grid place-items-center rounded-full bg-black/35 opacity-0 transition-opacity group-hover/avatar:opacity-100">
                      <Upload className="size-5 text-white" />
                    </span>
                    <input
                      id="avatar-upload-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={changeAvatar}
                      disabled={isUploadingAvatar}
                    />
                  </label>
                  <div className="flex flex-col items-center gap-0">
                    <ChangeName>
                      <p className="text-lg leading-tight hover:underline cursor-pointer">
                        {user.full_name}
                      </p>
                    </ChangeName>
                    <p className="text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                </DialogTitle>
                <DialogDescription className="w-full">
                  <div className="w-full mt-3 rounded-md border border-border/60 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t("profile.bio.title")}
                      </p>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="cursor-pointer"
                            onClick={() => {
                              setBioDraft(user.bio ?? "");
                              setBioErrorKey(null);
                              setIsEditingBio((prev) => !prev);
                            }}
                          >
                            <Pencil />
                          </Button>
                        </TooltipTrigger>

                        <TooltipContent>
                          {t("profile.bio.edit.title")}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {isEditingBio ? (
                      <div className="w-full flex flex-col gap-2 pt-2">
                        <Textarea
                          value={bioDraft}
                          onChange={(e) => setBioDraft(e.target.value)}
                          placeholder={t("profile.bio.empty")}
                          className="min-h-20"
                          maxLength={100}
                        />
                        <div className="w-full flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsEditingBio(false);
                              setBioDraft(user.bio ?? "");
                              setBioErrorKey(null);
                            }}
                            disabled={isSavingBio}
                            className="cursor-pointer"
                          >
                            {t("common.cancel")}
                          </Button>
                          <Button
                            type="button"
                            onClick={saveBio}
                            disabled={
                              isSavingBio || bioDraft === (user.bio ?? "")
                            }
                            className="cursor-pointer"
                          >
                            {t("common.submit")}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-foreground/80 whitespace-pre-wrap wrap-break-word pt-1">
                        {(user.bio ?? "").trim() || t("profile.bio.empty")}
                      </p>
                    )}
                  </div>
                </DialogDescription>
                {bioErrorKey && (
                  <p className="text-red-500 text-xs">
                    <Trans
                      i18nKey={bioErrorKey}
                      values={{ user: user.username }}
                    />
                  </p>
                )}
              </DialogHeader>

              {!isEditingBio && (
                <section className="w-full flex flex-col gap-2 pt-3 text-sm">
                  <div className="flex flex-row justify-between gap-1">
                    <span className="text-muted-foreground">
                      {t("stats.member_since", "Member since")}
                    </span>
                    <span>{formatMonthYear(user.registered_at) ?? "—"}</span>
                  </div>
                </section>
              )}
            </>
          )}

          {error && (
            <p className="text-red-500">
              <Trans i18nKey={error} values={{ user: user?.username ?? "" }} />
            </p>
          )}
        </DialogContent>
      </Dialog>

      {previewUrl && selectedAvatarFile && (
        <ConfirmationDialog
          open={true}
          title={t("settings.account.avatar.confirm.title")}
          description={t("settings.account.avatar.confirm.description")}
          onConfirm={uploadAvatar}
          confirmText={t("settings.account.avatar.confirm.upload")}
          isDestructive={false}
          isLoading={isUploadingAvatar}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSelectedAvatarFile(null);
              setPreviewUrl(null);
            }
          }}
          content={
            <img
              src={previewUrl}
              alt="Avatar preview"
              draggable={false}
              className="h-48 w-48 rounded-full object-cover border-4 border-primary/20"
            />
          }
        />
      )}
    </>
  );
}
