import Logger from 'color-logger';
import {DB} from './DB';
import {StreamsTable} from './StreamsTable';
import {GitHubQueryParser} from '../GitHub/GitHubQueryParser';

class _StreamsIssuesTable {
  async import(streamId, issues) {
    for (const issue of issues) {
      const params = [streamId, issue.id];
      const relation = await DB.selectSingle(`select * from streams_issues where stream_id = ? and issue_id = ?`, params);
      if (!relation) {
        await DB.exec('insert into streams_issues (stream_id, issue_id) values (?, ?)', params);
      }
    }

    await this._unlinkMismatchIssues(issues);

    // see IssuesTable
    await DB.exec(`
      delete from
        streams_issues
      where
        issue_id not in (select id from issues)
    `);
  }

  async _unlinkMismatchIssues(issues) {
    if (!issues.length) return;

    const issueIds = issues.map((issue) => issue.id).join(',');
    const streams = await StreamsTable.all();

    for (const stream of streams) {
      const rows = await DB.select(`select issue_id from streams_issues where stream_id = ? and issue_id in (${issueIds})`, [stream.id]);
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
        Logger.n(`[unlink]: stream: "${stream.name}", queries: "${queries.join(', ')}", [${realMismatchIssues.map(v => v.title)}]`);
        const mismatchIssueIds = realMismatchIssues.map((issue)=> issue.id).join(',');
        await DB.exec(`delete from streams_issues where stream_id = ? and issue_id in (${mismatchIssueIds}) `, [stream.id]);
      }
    }
  }

  async totalCount(streamId) {
    const result = await DB.selectSingle(`
        select
          count(1) as count
        from
          streams_issues
        where
          stream_id = ?
      `, [streamId]);
    return result.count;
  }
}

export const StreamsIssuesTable = new _StreamsIssuesTable();
