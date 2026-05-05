export type MessageItem = {
  id: string;
  conversation_id: string;
  sender_id: number;
  seq: number;
  type: string;
  content: {
    text?: string;
    event?: string;
    call_id?: string;
    status?: string;
    actor_user_id?: number;
    actor_display_name?: string;
    actor_username?: string;
    history?: Array<{
      text?: string;
      date?: string;
    }>;
    reply_to?: {
      id: string;
      sender_id: number;
      content: {
        text?: string | undefined;
      };
      created_at: string;
    };
  };
  created_at: string;
  edited_at: string | null;
  seen: boolean;
};

export type AccountMe = {
  id?: number;
};

export type MarkSeenResponse = {
  conversation_id: string;
  reader_id: number;
  seen_message_ids: string[];
  updated: number;
  last_seen_seq?: number;
};
