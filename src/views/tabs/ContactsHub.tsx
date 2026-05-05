import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRoundPlus, UsersRound } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import ContactRequests from "./RequestsTab";
import AddContactTab from "./AddContactTab";

type ContactRequestItem = {
  user: {
    id: number;
    username: string;
    full_name: string;
    avatar_url?: string | null;
  };
  created_at: string;
};

export default function ContactsHub() {
  const [open, setOpen] = useState(false);

  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const { data: requests } = useSWR<ContactRequestItem[]>(
    isAuthenticated ? "/contacts/v1/requests" : null,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    },
  );

  const requestCount = requests?.length ?? 0;

  if (!isAuthenticated) return <>Unauthorized.</>;

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon-sm"
            variant="outline"
            className="cursor-pointer h-full relative"
          >
            <UsersRound />
            {requestCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] leading-4 text-center">
                {requestCount > 99 ? "99+" : requestCount}
              </span>
            ) : null}
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-100 max-h-100 min-h-30 flex flex-col items-start justify-start">
          <Tabs defaultValue={"requests"} className="min-w-full">
            <TabsList>
              <TabsTrigger value="requests">
                <UsersRound />
                {t("contacts.requests.title")}
              </TabsTrigger>
              <TabsTrigger value="add">
                <UserRoundPlus />
                {t("contacts.add.title")}
              </TabsTrigger>
            </TabsList>
            <Separator />
            <TabsContent value={"requests"}>
              <ContactRequests />
            </TabsContent>
            <TabsContent value={"add"}>
              <AddContactTab />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
