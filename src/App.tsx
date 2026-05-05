import { ThemeProvider } from "./components/theme/theme";
import Tree from "./views/Tree";
import {
  AuthProvider,
  WS_STATUS_EVENT_NAME,
  type SharedWsStatusPayload,
} from "./auth/AuthContext";
import { AccountProvider } from "./account/AccountContext";
import { Toaster } from "./components/ui/sonner";
import { Progress } from "./components/ui/progress";
import Titlebar from "./components/common/Titlebar";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { CallOverlay, CallProvider } from "./views/home/calls";

type ConnectionStatus = SharedWsStatusPayload | null;

function ConnectionStatusBar() {
  const lastFailedToastShownRef = useRef(false);
  const [status, setStatus] = useState<ConnectionStatus>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const handleStatus = (event: Event) => {
      const customEvent = event as CustomEvent<unknown>;
      const detail = customEvent.detail;
      if (!detail || typeof detail !== "object") return;

      const nextStatus = detail as SharedWsStatusPayload;
      setStatus(nextStatus);

      if (nextStatus.phase === "connected") {
        lastFailedToastShownRef.current = false;
        return;
      }

      if (nextStatus.phase === "failed" && !lastFailedToastShownRef.current) {
        lastFailedToastShownRef.current = true;
        toast.error(nextStatus.message || t("common.connection.failed"));
      }
    };

    window.addEventListener(
      WS_STATUS_EVENT_NAME,
      handleStatus as EventListener,
    );

    return () => {
      window.removeEventListener(
        WS_STATUS_EVENT_NAME,
        handleStatus as EventListener,
      );
    };
  }, [t]);

  if (!status) return null;
  if (status.phase === "connected" || status.phase === "disconnected") {
    return null;
  }

  const isFailed = status.phase === "failed";

  return (
    <div className="inline-flex items-center justify-center w-full h-1 shrink-0 bg-sidebar backdrop-blur-sm">
      <Progress
        value={isFailed ? 100 : undefined}
        indeterminate={!isFailed}
        intent={isFailed ? "destructive" : "success"}
        className="h-full rounded-md border-0 bg-transparent w-[50%]"
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AccountProvider>
          <CallProvider>
            <div className="flex h-screen flex-col overflow-hidden">
              <Titlebar />
              <ConnectionStatusBar />
              <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
                <Tree />
              </div>
            </div>
            <CallOverlay />
          </CallProvider>
        </AccountProvider>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
