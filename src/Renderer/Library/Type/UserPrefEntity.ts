import {RemoteUserEntity} from './RemoteGitHubV3/RemoteIssueEntity';

export type UserPrefEntity = {
  github: {
    accessToken: string;
    host: string;
    pathPrefix: string;
    webHost: string;
    interval: number;
    https: boolean;
    user: RemoteUserEntity | null;
    gheVersion: string | null;
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
      streamsWidth: number;
      issuesWidth: number;
    };
    lang: 'system' | 'ja' | 'en';
  };
  database: {
    path: string;
    max: number;
  };
}
