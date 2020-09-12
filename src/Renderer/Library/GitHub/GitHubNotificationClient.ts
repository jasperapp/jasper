import {GitHubClient} from './GitHubClient';
import {RemoteGitHubNotification} from '../Type/RemoteGitHubV3/RemoteGitHubNotification';
import {DateUtil} from '../Util/DateUtil';

export class GitHubNotificationClient extends GitHubClient {
  // https://docs.github.com/en/rest/reference/activity#notifications
  async getNotifications(): Promise<{error?: Error; notifications?: RemoteGitHubNotification[]; pollIntervalMilliSec?: number}> {
    const query: any = {all: true, per_page: 100, before: DateUtil.localToUTCString(new Date())};
    const {error, body, headers} = await this.request<RemoteGitHubNotification[]>('/notifications', query);
    if (error) return {error};

    const pollIntervalSec = parseInt(headers.get('X-Poll-Interval'), 10) || 60;
    return {notifications: body, pollIntervalMilliSec: pollIntervalSec * 1000};
  }
}
