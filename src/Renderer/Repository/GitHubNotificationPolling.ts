import {GitHubNotificationClient} from '../Library/GitHub/GitHubNotificationClient';
import {UserPrefRepo} from './UserPrefRepo';
import {TimerUtil} from '../Library/Util/TimerUtil';
import {RemoteGitHubNotification} from '../Library/Type/RemoteGitHubV3/RemoteGitHubNotification';
import {GitHubUtil} from '../Library/Util/GitHubUtil';
import {IssueRepo} from './IssueRepo';
import {IssueEvent} from '../Event/IssueEvent';
import {IssueEntity} from '../Library/Type/IssueEntity';

class _GitHubNotificationPolling {
  private execId: number | null;

  start() {
    this.exec();
  }

  stop() {
    this.execId = null;
  }

  private async exec() {
    const execId = this.execId = Date.now();

    while (1) {
      if (!this.execId) return;
      if (execId !== this.execId) return;

      if (!UserPrefRepo.getPref().general.githubNotificationSync) {
        await TimerUtil.sleep(60 * 1000);
        continue;
      }

      const github = UserPrefRepo.getPref().github;
      const client = new GitHubNotificationClient(github.accessToken, github.host, github.pathPrefix, github.https);
      const {error, notifications, pollIntervalMilliSec} = await client.getNotifications();
      if (error) {
        console.error(error);
        await TimerUtil.sleep(60 * 1000);
        continue;
      }

      if (!this.execId) return;
      if (execId !== this.execId) return;

      const {error: e2} = await this.updateReadAt(notifications);
      if (e2) {
        console.error(e2);
        await TimerUtil.sleep(pollIntervalMilliSec || 60 * 1000);
        continue;
      }

      await TimerUtil.sleep(pollIntervalMilliSec || 60 * 1000);
    }
  }

  // github notificationのほうが閲覧時刻が新しければ、jasper外で既読にしたとみなして、ローカルのread_atを更新する
  private async updateReadAt(notifications: RemoteGitHubNotification[]): Promise<{error?: Error}> {
    const newIssues: IssueEntity[] = [];
    const oldIssues: IssueEntity[] = [];

    for (const notification of notifications) {
      const {repo, issueNumber} = GitHubUtil.getInfo(notification.subject.url);
      if (!repo || !issueNumber) continue;

      const {error, issue} = await IssueRepo.getIssueByIssueNumber(repo, issueNumber);
      if (error) return {error};
      if (!issue) continue;

      const lastReadAt = new Date(notification.last_read_at || 0).getTime();
      if (new Date(issue.read_at).getTime() < lastReadAt && new Date(issue.unread_at).getTime() < lastReadAt) {
        if (!notification.unread && !IssueRepo.isRead(issue)) {
          const {error, issue: newIssue} = await IssueRepo.updateRead(issue.id, new Date(notification.last_read_at));
          if (error) return {error};
          newIssues.push(newIssue);
          oldIssues.push(issue);
        } else if(notification.unread && IssueRepo.isRead(issue)) {
          const {error, issue: newIssue} = await IssueRepo.updateRead(issue.id, null);
          if (error) return {error};
          newIssues.push(newIssue);
          oldIssues.push(issue);
        }
      }
    }

    if (newIssues.length) {
      IssueEvent.emitUpdateIssues(newIssues, oldIssues, 'read');
    }

    return {};
  }
}

export const GitHubNotificationPolling = new _GitHubNotificationPolling();
