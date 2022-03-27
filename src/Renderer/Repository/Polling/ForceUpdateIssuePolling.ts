import {TimerUtil} from '../../Library/Util/TimerUtil';
import {IssueRepo} from '../IssueRepo';
import {UserPrefRepo} from '../UserPrefRepo';
import {GitHubV4IssueClient} from '../../Library/GitHub/V4/GitHubV4IssueClient';
import {StreamEvent} from '../../Event/StreamEvent';
import {ArrayUtil} from '../../Library/Util/ArrayUtil';
import {RemoteGitHubV4IssueEntity} from '../../Library/Type/RemoteGitHubV4/RemoteGitHubV4IssueNodesEntity';

// streamのポーリングでは受け取れないような更新を得るために、強制的にissueを取得する。
class _ForceUpdateIssuePolling {
  private execId: number;

  start() {
    this.exec();
  }

  stop() {
    this.execId = null;
  }

  private async exec() {
    const execId = this.execId = Date.now();

    while(1) {
      if (!this.execId) return;
      if (this.execId !== execId) return;

      await this.forceUpdateIssues();
      await TimerUtil.sleep(60 * 1000);
    }
  }

  private async forceUpdateIssues() {
    const {error: e0, nodeIds} = await this.getTargetIssueNodeIds();
    if (e0) return console.error(e0);
    if (nodeIds.length === 0) return;

    const {error: e1, issues: v4Issues} = await this.getV4Issues(nodeIds);
    if (e1) return console.error(e1);

    const {error: e2} = await IssueRepo.updateWithV4(v4Issues);
    if (e2) return console.error(e2);

    // 未読が更新されるケースがあるのでリロードする(例えば、未読issueのproject statusが変更されたとき、filterの未読数が変更される）
    // でも常にリロードするの微妙なので改善したほうがよい。
    StreamEvent.emitReloadAllStreams();
  }

  private async getTargetIssueNodeIds(): Promise<{error?: Error; nodeIds?: string[]}> {
    // project issues
    const {error: e1, issues: projectIssues} = await IssueRepo.getProjectIssues();
    if (e1) {
      return {error: e1};
    }

    // recently issues
    const {error: e2, issues: recentlyIssues} = await IssueRepo.getRecentlyIssues();
    if (e2) {
      return {error: e2};
    }

    const issues = [...projectIssues, ...recentlyIssues];
    const nodeIds = ArrayUtil.unique(issues.map(issue => issue.node_id));
    return {nodeIds};
  }

  private async getV4Issues(nodeIds: string[]): Promise<{error?: Error; issues?: RemoteGitHubV4IssueEntity[]}> {
    const github = UserPrefRepo.getPref().github;
    const client = new GitHubV4IssueClient(github.accessToken, github.host, github.https, UserPrefRepo.getGHEVersion());
    return await client.getIssuesByNodeIds(nodeIds);
  }
}

export const ForceUpdateIssuePolling = new _ForceUpdateIssuePolling();
