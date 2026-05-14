import { WS_MESSAGE_EVENT_NAME } from "@/auth/AuthContext";

export type ContactsWsEventPayload = {
  type: "contacts";
  event:
    | "contact.accepted"
    | "contact.removed"
    | "contact.last_action.updated"
    | "contact.last_message.updated";
  payload: Record<string, unknown>;
};

export function dispatchContactsEvent(payload: ContactsWsEventPayload) {
  window.dispatchEvent(
    new CustomEvent<ContactsWsEventPayload>(WS_MESSAGE_EVENT_NAME, {
      detail: payload,
    }),
  );
}
