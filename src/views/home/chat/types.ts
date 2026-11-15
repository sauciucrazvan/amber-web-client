export type MessageReactionDetails = {
  emoji: string;
  count: number;
  user_ids: number[];
  first_added_at?: string | null;
  created_at?: string | null;
};

export type MessageItem = {
  id: string;
  conversation_id: string;
  sender_id: number;
  seq: number;
  type: string;
  content: {
    url?: string;
    filename?: string;
    content_type?: string;
    size?: number;
    width?: number;
    height?: number;
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
      type?: string;
      id: string;
      sender_id: number;
      content: {
        filename?: string;
        text?: string | null;
      };
      created_at: string;
    };
  };
  created_at: string;
  edited_at: string | null;
  seen: boolean;
  reactions?: Record<string, number>;
  reaction_details?: MessageReactionDetails[];
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
