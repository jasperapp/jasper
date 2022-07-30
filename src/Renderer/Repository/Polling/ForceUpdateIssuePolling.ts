import {TimerUtil} from '../../Library/Util/TimerUtil';
import {IssueRepo} from '../IssueRepo';
import {UserPrefRepo} from '../UserPrefRepo';
import {GitHubV4IssueClient} from '../../Library/GitHub/V4/GitHubV4IssueClient';
import {StreamEvent} from '../../Event/StreamEvent';
import {ArrayUtil} from '../../Library/Util/ArrayUtil';
import {RemoteGitHubV4IssueEntity} from '../../Library/Type/RemoteGitHubV4/RemoteGitHubV4IssueNodesEntity';
import {IssueEntity} from '../../Library/Type/IssueEntity';
import {DB} from '../../Library/Infra/DB';
import {Logger} from '../../Library/Infra/Logger';

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
    const {error: e0, issues} = await this.getTargetIssues();
    if (e0) return console.error(e0);
    if (issues.length === 0) return;

    const {error: e1, issues: v4Issues} = await this.getV4Issues(issues);
    if (e1) return console.error(e1);

    const {error: e2} = await IssueRepo.updateWithV4(v4Issues);
    if (e2) return console.error(e2);

    // 未読が更新されるケースがあるのでリロードする(例えば、未読issueのproject statusが変更されたとき、filterの未読数が変更される）
    // でも常にリロードするの微妙なので改善したほうがよい。
    StreamEvent.emitReloadAllStreams();
  }

  private async getTargetIssues(): Promise<{ error?: Error; issues?: IssueEntity[] }> {
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

    const issues = ArrayUtil.uniqueFn([...projectIssues, ...recentlyIssues], (issue) => issue.node_id);
    return {issues};
  }

  private async getV4Issues(issues: IssueEntity[]): Promise<{ error?: Error; issues?: RemoteGitHubV4IssueEntity[] }> {
    const github = UserPrefRepo.getPref().github;
    const client = new GitHubV4IssueClient(github.accessToken, github.host, github.https, UserPrefRepo.getGHEVersion());
    const res = await client.getIssuesByNodeIds(issues);

    // ローカルDBには存在するが、「github上から削除されているissue」「アクセスできなくなったissue」などは、APIではnullが返ってくる。
    // そのようなissueはローカルDBからも削除しておく。
    if (res.error == null && res.notFoundIssues?.length > 0) {
      // 全てのエラーが許容できるエラーの場合のみ削除を実行する
      const isAllNotFound = res.partialErrors?.every(e => e.type === 'NOT_FOUND' || e.type === 'FORBIDDEN');
      if (isAllNotFound) {
        Logger.warning(_ForceUpdateIssuePolling.name, `delete not found issues.`, {
          notFoundIssues: res.notFoundIssues.map(v => v.html_url)
        });
        const nodeIds = res.notFoundIssues.map(v => v.node_id);
        const deleteIssueIds = issues.filter(issue => nodeIds.includes(issue.node_id)).map(issue => issue.id);
        let deleteRes = await DB.exec(`delete from issues where id in (${deleteIssueIds.join(',')})`);
        if (deleteRes.error) return {error: deleteRes.error};
        deleteRes = await DB.exec(`delete from streams_issues where issue_id in (${deleteIssueIds.join(',')})`);
        if (deleteRes.error) return {error: deleteRes.error};
      }
    }

    return res;
  }
}

export const ForceUpdateIssuePolling = new _ForceUpdateIssuePolling();
