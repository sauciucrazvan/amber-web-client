import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import ErrorBox from "@/components/common/error-box";
import Contact from "@/components/common/contact";
import type { TFunction } from "i18next";
import type { ActiveChat } from "@/views/home/chat";
import type { ContactListItem } from "../types";
import VerifyNotice from "./VerifyNotice";

type ContactsTabContentProps = {
  t: TFunction;
  contacts?: ContactListItem[];
  contactsError: unknown;
  isContactsLoading: boolean;
  showVerifyAccount: boolean;
  activeChat: ActiveChat | null;
  openingChatUserId: number | null;
  myUserId: number | null;
  conversationUnseenCountByUserId?: Record<number, number>;
  onOpenDirectChat: (contact: ContactListItem["user"]) => Promise<void>;
};

export default function ContactsTabContent({
  t,
  contacts,
  contactsError,
  isContactsLoading,
  showVerifyAccount,
  activeChat,
  openingChatUserId,
  myUserId,
  conversationUnseenCountByUserId,
  onOpenDirectChat,
}: ContactsTabContentProps) {
  if (isContactsLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="px-4 pt-4 shrink-0">
        <h2 className="text-lg font-semibold">{t("contacts.title")}</h2>
        {showVerifyAccount && (
          <VerifyNotice
            t={t}
            className="mt-3 rounded-md border bg-muted/40 px-3 py-2"
          />
        )}
      </div>

      <SidebarGroup className="flex-1 min-h-0 pt-2">
        <SidebarMenu className="flex-1 min-h-0 overflow-y-auto pr-1">
          {contactsError ? (
            <SidebarMenuItem>
              <ErrorBox>{t("contacts.failed_loading")}</ErrorBox>
            </SidebarMenuItem>
          ) : contacts && contacts.length > 0 ? (
            contacts.map((contact) => {
              const isActive = activeChat?.otherUser.id === contact.user.id;
              const unseen_messages = isActive
                ? 0
                : (conversationUnseenCountByUserId?.[contact.user.id] ?? 0);

              return (
                <SidebarMenuItem
                  key={`${contact.user.id}-${contact.created_at}`}
                >
                  <Contact
                    username={contact.user.username}
                    full_name={contact.user.full_name}
                    online={contact.user.online}
                    avatar_url={contact.user.avatar_url}
                    last_message={contact.last_message}
                    unseen_messages={unseen_messages}
                    isActive={isActive}
                    myUserId={myUserId}
                    onClick={() => onOpenDirectChat(contact.user)}
                    aria-busy={openingChatUserId === contact.user.id}
                  />
                </SidebarMenuItem>
              );
            })
          ) : (
            <SidebarMenuItem>
              <span className="mx-1 px-1 text-xs text-muted-foreground">
                {t("contacts.none")}
              </span>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}
