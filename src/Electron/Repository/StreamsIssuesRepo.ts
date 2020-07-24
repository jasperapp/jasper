import {DBIPC} from '../../IPC/DBIPC';
import {StreamsRepo} from './StreamsRepo';
import {GitHubQueryParser} from '../Infra/GitHubQueryParser';

class _StreamsIssuesRepo {
  async import(streamId: number, issues: any[]) {
    for (const issue of issues) {
      const params = [streamId, issue.id];
      const res = await DBIPC.selectSingle(`select * from streams_issues where stream_id = ? and issue_id = ?`, params);
      if (!res.row) {
        await DBIPC.exec('insert into streams_issues (stream_id, issue_id) values (?, ?)', params);
      }
    }

    await this.unlinkMismatchIssues(issues);

    // see IssuesTable
    await DBIPC.exec(`
      delete from
        streams_issues
      where
        issue_id not in (select id from issues)
    `);
  }

  private async unlinkMismatchIssues(issues: any[]) {
    if (!issues.length) return;

    const issueIds = issues.map((issue) => issue.id).join(',');
    const res = await StreamsRepo.all();

    for (const stream of res.rows) {
      const {rows} = await DBIPC.select(`select issue_id from streams_issues where stream_id = ? and issue_id in (${issueIds})`, [stream.id]);
      if (!rows.length) continue;

      const targetIssueIds = rows.map((row) => row.issue_id);
      const targetIssues = issues.filter((issue) => targetIssueIds.includes(issue.id));
      const queries = JSON.parse(stream.queries);

      // pickup mismatch issues for each query
      const mismatchIssues = [];
      for (const query of queries) {
        mismatchIssues.push(...GitHubQueryParser.takeMismatchIssues(query, targetIssues));
      }

      // pickup mismatching issues for all query
      const realMismatchIssues = [];
      {
        const countMap = new Map();
        for (const mismatchIssue of mismatchIssues) {
          if (!countMap.has(mismatchIssue)) countMap.set(mismatchIssue, 0);
          countMap.set(mismatchIssue, countMap.get(mismatchIssue) + 1);
        }

        for (const mismatchIssue of countMap.keys()) {
          const count = countMap.get(mismatchIssue);
          if (count === queries.length) realMismatchIssues.push(mismatchIssue);
        }
      }

      // unlink mismatch issues
      if (realMismatchIssues.length) {
        console.log(`[unlink]: stream: "${stream.name}", queries: "${queries.join(', ')}", [${realMismatchIssues.map(v => v.title)}]`);
        const mismatchIssueIds = realMismatchIssues.map((issue)=> issue.id).join(',');
        await DBIPC.exec(`delete from streams_issues where stream_id = ? and issue_id in (${mismatchIssueIds}) `, [stream.id]);
      }
    }
  }

  async totalCount(streamId: number): Promise<{error?: Error; count?: number}> {
    const result = await DBIPC.selectSingle(`
        select
          count(1) as count
        from
          streams_issues
        where
          stream_id = ?
      `, [streamId]);
    return {count: result.row.count};
  }
}

export const StreamsIssuesRepo = new _StreamsIssuesRepo();
