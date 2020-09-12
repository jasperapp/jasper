// https://docs.github.com/en/rest/reference/activity#notifications
export type RemoteGitHubNotification = {
  id: number;
  reason: 'assign' | 'author' | 'comment' | 'invitation' | 'manual' | 'mention' | 'review_requested' | 'security_alert' | 'state_change' | 'subscribed' | 'team_mention';
  last_read_at: string | null;
  subject: {
    url: string;
  };
  unread: boolean;
  updated_at: string;
}
