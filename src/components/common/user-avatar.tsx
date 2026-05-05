import { cn, initialsFromName, stringToColor } from "@/lib/utils";
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "../ui/avatar";

type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

interface UserAvatarProps {
  full_name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  isLoading?: boolean | null;
  isOnline?: boolean | null;
  size?: AvatarSize | null;
}

const avatarSizeClasses: Record<AvatarSize, string> = {
  xs: "size-6",
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
  xl: "size-16",
};

const avatarTextSizeClasses: Record<AvatarSize, string> = {
  xs: "text-xs text-white",
  sm: "text-sm text-white",
  md: "text-base text-white",
  lg: "text-lg text-white",
  xl: "text-xl text-white",
};

const avatarBadgeSizeClasses: Record<AvatarSize, string> = {
  xs: "size-1",
  sm: "size-1.5",
  md: "size-2",
  lg: "size-2.5",
  xl: "size-2.75",
};

export default function UserAvatar({
  full_name,
  username,
  avatarUrl,
  isLoading,
  isOnline,
  size,
}: UserAvatarProps) {
  const resolvedSize = size ?? "sm";
  const avatarSizeClass = avatarSizeClasses[resolvedSize];
  const avatarTextSizeClass = avatarTextSizeClasses[resolvedSize];
  const avatarBadgeSizeClass = avatarBadgeSizeClasses[resolvedSize];

  return (
    <div className="relative inline-flex align-middle">
      <Avatar className={avatarSizeClass}>
        <AvatarImage src={avatarUrl || ""} alt={full_name || username || ""} />
        <AvatarFallback
          className={avatarTextSizeClass}
          style={
            full_name
              ? {
                  backgroundColor: stringToColor(full_name ?? ""),
                }
              : undefined
          }
        >
          {full_name
            ? initialsFromName(String(full_name))
            : username
              ? initialsFromName(username)
              : isLoading
                ? "…"
                : ""}
        </AvatarFallback>
      </Avatar>
      {isOnline != null && (
        <AvatarBadge
          aria-label={isOnline ? "Online" : "Offline"}
          title={isOnline ? "Online" : "Offline"}
          className={cn(
            avatarBadgeSizeClass,
            isOnline ? "bg-emerald-500" : "bg-red-500",
          )}
        />
      )}
    </div>
  );
}
