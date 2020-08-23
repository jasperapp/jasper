import {GitHubQueryParser} from '../Library/GitHub/GitHubQueryParser';
import {IssueEntity} from '../Library/Type/IssueEntity';
import {StreamIssueEntity} from '../Library/Type/StreamIssueEntity';
import {DB} from '../Library/Infra/DB';
import {StreamRepo} from './StreamRepo';

class _StreamIssueRepo {
  // todo: IssueRepoに移動する
  async createBulk(streamId: number, issues: IssueEntity[]): Promise<{error?: Error}> {
    if (!issues.length) return {};

    // get StreamIssue
    const {error: e1, rows} = await DB.select<StreamIssueEntity>(`select * from streams_issues where stream_id = ?`, [streamId]);
    if (e1) return {error: e1};

    // filter notExistIssues
    const existIssueIds = rows.map(row => row.issue_id);
    const notExistIssues = issues.filter(issue => !existIssueIds.includes(issue.id));

    // insert bulk issues
    if (notExistIssues.length) {
      const bulkParams = notExistIssues.map(issue => `(${streamId}, ${issue.id})`);
      const {error: e2} = await DB.exec(`insert into streams_issues (stream_id, issue_id) values ${bulkParams.join(',')}`);
      if (e2) return {error: e2};
    }

    // unlink mismatch issues
    const {error: e3} = await this.unlinkMismatchIssues(issues);
    if (e3) return {error: e3};

    // delete unlinked issues
    const {error: e4} = await DB.exec(`delete from streams_issues where issue_id not in (select id from issues)`);
    if (e4) return {error: e4};

    return {};
  }

  private async unlinkMismatchIssues(issues: IssueEntity[]): Promise<{error?: Error}> {
    const res = await StreamRepo.getAllStreams(['custom']);
    if (res.error) return {error: res.error};

    const issueIds = issues.map(issue => issue.id).join(',');
    for (const stream of res.streams) {
      const {error, rows} = await DB.select<StreamIssueEntity>(`select * from streams_issues where stream_id = ? and issue_id in (${issueIds})`, [stream.id]);
      if (error) return {error};
      if (!rows.length) continue;

      // filter target issues
      const targetIssueIds = rows.map(row => row.issue_id);
      const targetIssues = issues.filter(issue => targetIssueIds.includes(issue.id));
      const queries = JSON.parse(stream.queries);

      // queryごとにmismatchのissueを取り出す
      const mismatchIssues: IssueEntity[] = [];
      for (const query of queries) {
        mismatchIssues.push(...this.getMismatchIssues(query, targetIssues));
      }

      // すべてのqueryにmismatchのissueを取り出す
      const realMismatchIssues: IssueEntity[] = [];
      for (const issue of mismatchIssues) {
        const count = mismatchIssues.filter(v => v.id === issue.id).length;
        if (count === queries.length) realMismatchIssues.push(issue);
      }

      // unlink mismatch issues
      if (realMismatchIssues.length) {
        console.log(`[unlink]: stream: "${stream.name}", queries: "${queries.join(', ')}", [${realMismatchIssues.map(v => v.title)}]`);
        const mismatchIssueIds = realMismatchIssues.map(issue => issue.id).join(',');
        const {error} = await DB.exec(`delete from streams_issues where stream_id = ? and issue_id in (${mismatchIssueIds})`, [stream.id]);
        if (error) return {error};
      }
    }

    return {}
  }

  async totalCount(streamId: number): Promise<{error?: Error; count?: number}> {
    const {error, row} = await DB.selectSingle<{count: number}>(`select count(1) as count from streams_issues where stream_id = ? `, [streamId]);
    if (error) return {error};

    return {count: row.count};
  }

  private getMismatchIssues(query: string, issues: IssueEntity[]): IssueEntity[] {
    // todo: check with negativeMap
    const {positive: positiveMap} = GitHubQueryParser.parse(query);
    const mismatchIssues = [];
    for (const issue of issues) {
      if (positiveMap.is.open && issue.closed_at) {
        mismatchIssues.push(issue);
        continue;
      }

      if (positiveMap.is.closed && !issue.closed_at) {
        mismatchIssues.push(issue);
        continue;
      }

      if (positiveMap.assignees.length) {
        const names = issue.value.assignees.map(assignee => assignee.login.toLowerCase());
        const res = positiveMap.assignees.some(assignee => names.includes(assignee));
        if (!res) {
          mismatchIssues.push(issue);
          continue;
        }
      }

      if (positiveMap.labels.length) {
        const names = issue.value.labels.map(label => label.name.toLowerCase());
        const res = positiveMap.labels.every(label => names.includes(label));
        if (!res) {
          mismatchIssues.push(issue);
          continue;
        }
      }

      if (positiveMap.milestones.length) {
        const res = positiveMap.milestones.some(milestone => issue.value.milestone?.title.toLowerCase() === milestone);
        if (!res) {
          mismatchIssues.push(issue);
          continue;
        }
      }
    }

    return mismatchIssues;
  }
}

export const StreamIssueRepo = new _StreamIssueRepo();
