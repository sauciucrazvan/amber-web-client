import { useAuth } from "@/auth/AuthContext";
import ErrorBox from "@/components/common/error-box";
import UserAvatar from "@/components/common/user-avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { apiUrl } from "@/config";
import { Check, X } from "lucide-react";
import { type ReactNode, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

type ContactRequestItem = {
  user: {
    id: number;
    username: string;
    full_name: string;
    avatar_url?: string | null;
    online?: boolean;
  };
  created_at: string;
};

type GroupedRequests = Array<{
  date: string;
  requests: ContactRequestItem[];
}>;

async function readErrorMessage(res: Response) {
  try {
    const data = await res.json();
    if (typeof data?.detail === "string") return data.detail;
  } catch {
    return `Request failed (${res.status})`;
  }
  return `Request failed (${res.status})`;
}

type ContactRequestsProps = {
  notice?: ReactNode;
};

export default function ContactRequests({ notice }: ContactRequestsProps) {
  const [actionUserId, setActionUserId] = useState<number | null>(null);

  function groupRequestsByDate(
    requests: ContactRequestItem[],
    locale: string,
  ): GroupedRequests {
    const grouped = new Map<string, ContactRequestItem[]>();

    for (const request of requests) {
      const date = new Date(request.created_at).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const existing = grouped.get(date);
      if (existing) {
        existing.push(request);
      } else {
        grouped.set(date, [request]);
      }
    }

    return Array.from(grouped.entries()).map(([date, dateRequests]) => ({
      date,
      requests: dateRequests,
    }));
  }
  const { isAuthenticated, authFetch } = useAuth();

  const { t, i18n } = useTranslation();

  const resolveMessage = (
    message: unknown,
    fallback: string,
    values?: Record<string, string>,
  ) => {
    const messageText = typeof message === "string" ? message : fallback;
    const translated = messageText.includes(".") ? t(messageText) : messageText;

    if (!values) return translated;

    return Object.entries(values).reduce(
      (result, [key, value]) => result.replace(`{{${key}}}`, value),
      translated,
    );
  };

  const {
    data: requests,
    error: requestsError,
    isLoading: isRequestsLoading,
  } = useSWR<ContactRequestItem[]>(
    isAuthenticated ? "/contacts/v1/requests" : null,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );

  const performAction = async (
    action: "accept" | "decline",
    target: {
      id: number;
      username: string;
      full_name: string;
      avatar_url?: string | null;
      online?: boolean;
    },
  ) => {
    setActionUserId(target.id);
    try {
      const res = await authFetch(apiUrl(`/contacts/v1/${action}`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: target.username,
        }),
      });

      if (!res.ok) {
        if (res.status === 429) {
          throw new Error("common.errors.too_many_requests");
        }

        throw new Error(await readErrorMessage(res));
      }

      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      const message =
        data && typeof data === "object" && "message" in data
          ? (data as { message?: unknown }).message
          : null;

      const fallbackMessageKey =
        action === "accept" ? "contacts.accepted" : "contacts.declined";

      toast.success(
        resolveMessage(message, fallbackMessageKey, { user: target.username }),
      );
      await mutate("/contacts/v1/requests");
    } catch (e) {
      const message = e instanceof Error ? e.message : "common.errors.generic";
      toast.error(resolveMessage(message, "common.errors.generic"));
    } finally {
      setActionUserId(null);
    }
  };

  const groupedRequests = requests
    ? groupRequestsByDate(requests, i18n.language)
    : [];

  const requestsErrorMessage = requestsError
    ? resolveMessage(
        requestsError instanceof Error ? requestsError.message : null,
        "contacts.failed_loading",
      )
    : null;

  if (isRequestsLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <h2 className="text-lg font-semibold mb-4">
        {t("contacts.requests.title")}
      </h2>
      {notice && <div className="mb-4">{notice}</div>}
      {requestsError ? (
        <ErrorBox>{requestsErrorMessage}</ErrorBox>
      ) : groupedRequests.length > 0 ? (
        <div className="w-full min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="w-full flex flex-col gap-4">
            {groupedRequests.map(({ date, requests: dateRequests }) => (
              <div key={date}>
                <div className="text-sm text-muted-foreground mb-2">{date}</div>
                <div className="w-full border rounded-lg overflow-hidden shadow-sm">
                  {dateRequests.map((req, idx) => {
                    return (
                      <div
                        key={`${req.user.id}-${req.created_at}`}
                        className={`w-full flex gap-3 items-start p-3 bg-primary/7 ${
                          idx < dateRequests.length - 1 ? "border-b" : ""
                        }`}
                      >
                        <div className="shrink-0">
                          <UserAvatar
                            full_name={req.user.full_name}
                            username={req.user.username}
                            avatarUrl={req.user.avatar_url}
                            size="md"
                          />
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                          <div>
                            <div className="text-xs">
                              <Trans
                                i18nKey={"contacts.requests.notification"}
                                values={{ user: req.user.username }}
                                components={{ b: <b /> }}
                              />
                            </div>
                          </div>
                          <div className="flex gap-1 w-full">
                            <Button
                              size={"icon-sm"}
                              variant={"outline"}
                              onClick={() =>
                                performAction("accept", {
                                  id: req.user.id,
                                  username: req.user.username,
                                  full_name: req.user.full_name,
                                  avatar_url: req.user.avatar_url ?? null,
                                  online: req.user.online ?? false,
                                })
                              }
                              disabled={actionUserId === req.user.id}
                              className="w-[50%] cursor-pointer text-xs font-medium hover:text-green-400 transition ease-in-out duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Check size="20" />
                            </Button>
                            <Button
                              size={"icon-sm"}
                              variant={"outline"}
                              onClick={() =>
                                performAction("decline", {
                                  id: req.user.id,
                                  username: req.user.username,
                                  full_name: req.user.full_name,
                                  avatar_url: req.user.avatar_url ?? null,
                                  online: req.user.online ?? false,
                                })
                              }
                              disabled={actionUserId === req.user.id}
                              className="w-[50%] cursor-pointer text-xs font-medium hover:text-red-400 transition ease-in-out duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <X size="20" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("contacts.requests.none")}
        </p>
      )}
    </>
  );
}
