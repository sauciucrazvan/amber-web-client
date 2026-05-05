import { Sidebar, SidebarContent, useSidebar } from "../ui/sidebar";
import { Tabs, TabsContent } from "../ui/tabs";
import { useAuth } from "@/auth/AuthContext";
import { useTranslation } from "react-i18next";
import { useChat } from "@/views/home/chat";
import {
  CallHistoryTabContent,
  ContactsTabContent,
  SidebarRail,
  VerifyNotice,
  useAppSidebarData,
  useResizableSidebar,
} from "./app-sidebar/index";

import RequestsTab from "@/views/tabs/RequestsTab";

export default function AppSidebar() {
  const { isAuthenticated, authFetch } = useAuth();
  const { t } = useTranslation();
  const { openDirectChat, openingChatUserId, activeChat } = useChat();
  const { open, isMobile } = useSidebar();

  const {
    sidebarSide,
    tooltipSide,
    tabsDirectionClass,
    railPaddingClass,
    panelChromeClass,
    resizeHandleClass,
    handleResizeStart,
  } = useResizableSidebar();

  const {
    account,
    isAccountLoading,
    contacts,
    contactsError,
    isContactsLoading,
    conversationUnseenCountByUserId,
    requestCount,
    callHistory,
    callHistoryError,
    isCallHistoryLoading,
    showVerifyAccount,
    handleOpenDirectChat,
  } = useAppSidebarData({
    isAuthenticated,
    authFetch,
    openDirectChat,
  });

  if (!isAuthenticated) return <>Unauthorized.</>;
  if (!isMobile && !open) return null;

  return (
    <>
      <Sidebar collapsible="offcanvas" side={sidebarSide} className="relative">
        <SidebarContent className="min-h-0 overflow-hidden">
          <Tabs
            defaultValue="contacts"
            className={`flex h-full min-h-0 ${tabsDirectionClass} gap-1`}
          >
            <SidebarRail
              railPaddingClass={railPaddingClass}
              tooltipSide={tooltipSide}
              requestCount={requestCount}
              account={account}
              isAccountLoading={isAccountLoading}
              t={t}
            />

            <TabsContent
              value="contacts"
              className={`min-h-0 flex-1 overflow-hidden ${panelChromeClass} bg-background p-0 flex flex-col`}
            >
              <ContactsTabContent
                t={t}
                contacts={contacts}
                contactsError={contactsError}
                isContactsLoading={isContactsLoading}
                showVerifyAccount={showVerifyAccount}
                activeChat={activeChat}
                openingChatUserId={openingChatUserId}
                myUserId={account?.id ?? null}
                conversationUnseenCountByUserId={
                  conversationUnseenCountByUserId
                }
                onOpenDirectChat={handleOpenDirectChat}
              />
            </TabsContent>

            <TabsContent
              value="requests"
              className={`min-h-0 flex-1 overflow-hidden ${panelChromeClass} bg-background p-4 flex flex-col`}
            >
              <RequestsTab
                notice={
                  showVerifyAccount ? (
                    <VerifyNotice
                      t={t}
                      className="rounded-md border bg-muted/40 px-3 py-2"
                    />
                  ) : null
                }
              />
            </TabsContent>

            <TabsContent
              value="call-history"
              className={`min-h-0 flex-1 overflow-hidden ${panelChromeClass} bg-background p-0 flex flex-col`}
            >
              <CallHistoryTabContent
                t={t}
                callHistory={callHistory}
                callHistoryError={callHistoryError}
                isCallHistoryLoading={isCallHistoryLoading}
                openingChatUserId={openingChatUserId}
                onOpenDirectChat={handleOpenDirectChat}
              />
            </TabsContent>
          </Tabs>
        </SidebarContent>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          onMouseDown={handleResizeStart}
          className={resizeHandleClass}
        />
      </Sidebar>
    </>
  );
}
