export type UserPrefEntity = {
  github: {
    accessToken: string;
    host: string;
    pathPrefix: string;
    webHost: string;
    interval: number;
    https: boolean;
  };
  general: {
    browser: 'builtin' | 'external';
    notification: boolean;
    notificationSilent: boolean;
    onlyUnreadIssue: boolean;
    badge: boolean;
    alwaysOpenExternalUrlInExternalBrowser: boolean;
    githubNotificationSync: boolean;
    style: {
      themeMode: 'system' | 'light' | 'dark';
      enableThemeModeOnGitHub: boolean;
      streamsWidth: number;
      issuesWidth: number;
    }
  };
  database: {
    path: string;
    max: number;
  };
}
