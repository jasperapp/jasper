export type ConfigType = {
  github: {
    accessToken: string;
    host: string;
    pathPrefix: string;
    webHost: string;
    interval: number;
    https: boolean;
  };
  general: {
    browser: null | 'builtin' | 'external';
    notification: boolean;
    notificationSilent: boolean;
    onlyUnreadIssue: boolean;
    badge: boolean;
    alwaysOpenExternalUrlInExternalBrowser: boolean;
  };
  theme: {
    main: string;
    browser: string;
  };
  database: {
    path: string;
    max: number;
  };
}
