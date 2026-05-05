import { useAuth } from "@/auth/AuthContext";
import { useAccount } from "@/account/AccountContext";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useTranslation } from "react-i18next";
import UserAvatar from "@/components/common/user-avatar";
import {
  BadgeAlert,
  ChevronRight,
  LogOut,
  KeyRound,
  Mail,
  Shield,
  ShieldBan,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import RequestData from "./dialogs/RequestData";
import SignOut from "./dialogs/SignOut";
import BlockedAccounts from "@/views/dialogs/BlockedAccounts";
import VerifyAccount from "@/views/dialogs/VerifyAccount";
import { ChangeEvent, useState } from "react";
import { apiUrl } from "@/config";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import ChangeEmail from "./dialogs/ChangeEmail";
import ChangeName from "./dialogs/ChangeName";
import ChangePassword from "./dialogs/ChangePassword";
import DeleteAccount from "./dialogs/DeleteAccount";

export default function AccountTab() {
  const { isAuthenticated, authFetch } = useAuth();
  const { account, error, isLoading } = useAccount();
  const { t } = useTranslation();

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!isAuthenticated) return <>Unauthorized.</>;

  const displayName = error
    ? "Failed to load"
    : isLoading
      ? "Loading..."
      : (account?.full_name ?? "");

  const username = error
    ? ""
    : isLoading
      ? ""
      : account?.username
        ? `@${account.username}`
        : "";

  const rowClassName =
    "group w-full min-w-0 cursor-pointer flex items-center justify-between rounded-lg px-2.5 py-2 transition-colors hover:bg-secondary/70";

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
        throw new Error(res.statusText);
      }

      toast.success(t("settings.account.avatar.uploaded"));
      setSelectedAvatarFile(null);
      setPreviewUrl(null);
    } catch (e) {
      toast.error(
        e instanceof Error ? t(e.message) : t("settings.account.avatar.error"),
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-5 pr-1 pb-6">
      <section className="space-y-2">
        <div className="px-1">
          <h3 className="text-sm font-medium">
            {t("settings.account.details.title", "Account details")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t(
              "settings.account.details.description",
              "Your public profile and login identity.",
            )}
          </p>
        </div>

        <div className="flex flex-row items-center justify-between gap-2 rounded-lg px-2.5 py-2 hover:bg-secondary/50 transition-colors">
          <div className="min-w-0 flex flex-row items-center gap-2.5">
            <label
              htmlFor="avatar-upload-input"
              className="relative cursor-pointer group/avatar"
            >
              <UserAvatar
                full_name={account?.full_name}
                username={account?.username}
                avatarUrl={account?.avatar_url}
                size="md"
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

            <div className="min-w-0 flex flex-col justify-start items-start gap-0">
              <h4 className="truncate text-sm leading-tight">{displayName}</h4>
              <p className="truncate text-muted-foreground text-xs text-start">
                {username}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <div className="px-1">
          <h3 className="text-sm font-medium">
            {t("settings.account.manage.title", "Manage account details")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t(
              "settings.account.manage.description",
              "Update your display name, email, and password from one place.",
            )}
          </p>
        </div>

        <div>
          <ChangeName>
            <div className={rowClassName}>
              <div className="min-w-0 flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                  <UserRound className="h-3.5 w-3.5" />
                </div>
                <p className="truncate text-xs font-medium">
                  {t("settings.account.name.title")}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </ChangeName>

          <Separator className="my-1" />

          <ChangeEmail>
            <div className={rowClassName}>
              <div className="min-w-0 flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <p className="truncate text-xs font-medium">
                  {t("settings.account.email.title")}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </ChangeEmail>

          <Separator className="my-1" />

          <ChangePassword>
            <div className={rowClassName}>
              <div className="min-w-0 flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                  <KeyRound className="h-3.5 w-3.5" />
                </div>
                <p className="truncate text-xs font-medium">
                  {t("settings.account.password.title")}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </ChangePassword>

          <Separator className="my-1" />

          <DeleteAccount>
            <div className={rowClassName}>
              <div className="min-w-0 flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                  <Trash2 className="h-3.5 w-3.5" />
                </div>
                <p className="truncate text-xs font-medium">
                  {t("settings.account.delete.title")}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </DeleteAccount>
        </div>
      </section>

      <section className="space-y-2">
        <div className="px-1">
          <h3 className="text-sm font-medium">
            {t("settings.account.general.title", "General settings")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t(
              "settings.account.general.description",
              "Privacy, safety, and data management.",
            )}
          </p>
        </div>

        <div>
          {account?.verified === false && (
            <>
              <VerifyAccount>
                <div className={rowClassName}>
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                      <BadgeAlert className="h-3.5 w-3.5" />
                    </div>
                    <p className="truncate text-xs font-medium">
                      {t("register.verify.verify_now")}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </VerifyAccount>
              <Separator className="my-1" />
            </>
          )}

          {account?.verified && (
            <>
              <BlockedAccounts>
                <div className={rowClassName}>
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                      <ShieldBan className="h-3.5 w-3.5" />
                    </div>
                    <p className="truncate text-xs font-medium">
                      {t("contacts.blocked.trigger")}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </BlockedAccounts>
              <Separator className="my-1" />
            </>
          )}

          <SignOut>
            <div className={rowClassName}>
              <div className="min-w-0 flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                  <LogOut className="h-3.5 w-3.5" />
                </div>
                <p className="truncate text-xs font-medium">
                  {t("settings.account.signOut.title")}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </SignOut>

          <Separator className="my-1" />

          <RequestData>
            <div className={rowClassName}>
              <div className="min-w-0 flex items-center gap-2">
                <div className="grid h-6 w-6 place-items-center rounded-md bg-primary/10 text-primary">
                  <Shield className="h-3.5 w-3.5" />
                </div>
                <p className="truncate text-xs font-medium">
                  {t("settings.account.data.title")}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
          </RequestData>
        </div>
      </section>

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
    </div>
  );
}
