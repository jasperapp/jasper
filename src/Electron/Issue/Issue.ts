import {IssueFilter} from './IssueFilter';
import {DBIPC} from '../../IPC/DBIPC';

class _Issue {
  async findIssues(streamId, filterQuery = null, pageNumber = 0, perPage = 30) {
    const sql = this._buildSQL();
    let issues;
    let totalCount;
    const offset = pageNumber * perPage;

    const extraCondition = IssueFilter.buildCondition(filterQuery);
    if (extraCondition.filter) {
      // hack
      sql.issuesQuery = sql.issuesQuery.replace('where -- replace', `where ${extraCondition.filter} and`);
      sql.countQuery = sql.countQuery.replace('where -- replace', `where ${extraCondition.filter} and`);
    }
    if (extraCondition.sort) {
      // hack
      sql.issuesQuery = sql.issuesQuery.replace(/order by\s+[\w\s]+/m, `order by ${extraCondition.sort}\n`);
    }

    const {row: temp} = await DBIPC.selectSingle(sql.countQuery, [streamId]);
    totalCount = temp.count;

    // hack: if pageNumber is negative, immediate return. because performance.
    if (pageNumber < 0) return {totalCount};

    const {rows} = await DBIPC.select(sql.issuesQuery + ` limit ${offset}, ${perPage}`, [streamId]);
    issues = rows;
    for (const issue of issues) {
      const value = JSON.parse(issue.value);

      // todo: this hack is for old github response
      // we must add value.assignee before `issue.value = value`.
      // because issue.value is setter/getter, so setter behavior is special.
      if (!value.assignees) {
        value.assignees = value.assignee ? [value.assignee] : [];
      }

      issue.value = value;
    }

    const hasNextPage = offset + perPage < totalCount;
    return {issues, totalCount, hasNextPage};
  }

  _buildSQL() {
    const issuesQuery = `
      select
        t1.*
      from
        issues as t1
      inner join
        streams_issues as t2 on t1.id = t2.issue_id
      where -- replace
        stream_id = ?
        and archived_at is null
      order by
        updated_at desc
    `;

    const countQuery = `
      select
        count(1) as count
      from
        issues as t1
      inner join
        streams_issues as t2 on t1.id = t2.issue_id
      where -- replace
        stream_id = ?
        and archived_at is null
    `;

    return {issuesQuery, countQuery};
  }

  async includeIds(streamId, issueIds, filter = null) {
    let filterCondition = '';
    if (filter) {
      const tmp = IssueFilter.buildCondition(filter);
      filterCondition = `inner join (select id from issues where ${tmp.filter}) as t2 on t1.issue_id = t2.id`;
    }

    const {rows: includedIssueIds} = await DBIPC.select(`
      select
        issue_id
      from
        streams_issues as t1
      ${filterCondition}
      where
        stream_id = ? and
        issue_id in (${issueIds.join(',')})
    `, [streamId]);

    return includedIssueIds.map((item)=> item.issue_id);
  }
}

export const Issue = new _Issue();
