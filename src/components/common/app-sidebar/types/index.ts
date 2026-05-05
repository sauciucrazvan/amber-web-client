export type AccountMe = {
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  verified?: boolean | null;
};

export type ContactListItem = {
  user: {
    id: number;
    username: string;
    full_name: string;
    avatar_url?: string | null;
    online?: boolean;
    last_active_at?: string | null;
  };
  created_at: string;
  last_action_at?: string;
  notifications?: number;
  last_message?: {
    sender_id: number;
    type: string;
    content?: {
      text?: string;
      event?: string;
      call_id?: string;
      filename?: string;
      name?: string;
      file_name?: string;
    };
    created_at?: string | null;
  } | null;
};

export type DirectConversationSummary = {
  id: string;
  type: string;
  direct_pair?: string | null;
  created_at: string;
  notifications?: number;
};

export type CallHistoryItem = {
  call_id: string;
  status: string;
  call_mode: "audio" | "video";
  started_at?: string | null;
  ended_at?: string | null;
  duration_seconds?: number;
  end_reason?: string | null;
  peer: {
    id: number;
    username: string;
    avatar_url: string;
    display_name?: string;
    last_active_at?: string | null;
  };
};
