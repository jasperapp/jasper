// import moment from 'moment';
// import {DBIPC} from '../../../IPC/DBIPC';
//
// class _LibraryIssue {
  // async findIssues(libraryStreamName, filterQuery = null, pageNumber = 0, perPage = 30) {
  //   let sql;
  //   switch (libraryStreamName) {
  //     case 'Inbox': sql = this._buildInboxSQL(); break;
  //     case 'Unread': sql = this._buildUnreadSQL(); break;
  //     case 'Marked': sql = this._buildMarkedSQL(); break;
  //     case 'Open': sql = this._buildOpenSQL(); break;
  //     case 'Archived': sql = this._buildArchivedSQL(); break;
  //   }
  //
  //   let issues;
  //   let totalCount;
  //   const offset = pageNumber * perPage;
  //
  //   const extraCondition = IssueFilter.buildCondition(filterQuery);
  //   if (extraCondition.filter) {
  //     // hack
  //     sql.issuesQuery = sql.issuesQuery.replace('where', `where ${extraCondition.filter} and`);
  //     sql.countQuery = sql.countQuery.replace('where', `where ${extraCondition.filter} and`);
  //   }
  //   if (extraCondition.sort) {
  //     // hack
  //     sql.issuesQuery = sql.issuesQuery.replace(/order by\s+[\w\s]+/m, `order by ${extraCondition.sort}\n`);
  //   }
  //
  //   const {rows} = await DBIPC.select(sql.issuesQuery + ` limit ${offset}, ${perPage}`);
  //   issues = rows;
  //   for (const issue of issues) {
  //     const value = JSON.parse(issue.value);
  //
  //     // todo: this hack is for old github response
  //     // we must add value.assignee before `issue.value = value`.
  //     // because issue.value is setter/getter, so setter behavior is special.
  //     if (!value.assignees) {
  //       value.assignees = value.assignee ? [value.assignee] : [];
  //     }
  //
  //     issue.value = value;
  //   }
  //
  //   const {row: temp} = await DBIPC.selectSingle(sql.countQuery);
  //   totalCount = temp.count;
  //
  //   const hasNextPage = offset + perPage < totalCount;
  //   return {issues, totalCount, hasNextPage};
  // }

  // async findIssuesWithFunnel(libraryStreamName, funnelIssueIds) {
  //   let sql;
  //   switch (libraryStreamName) {
  //     case 'Inbox': sql = this._buildInboxSQL(); break;
  //     case 'Unread': sql = this._buildUnreadSQL(); break;
  //     case 'Marked': sql = this._buildMarkedSQL(); break;
  //     case 'Open': sql = this._buildOpenSQL(); break;
  //     case 'Archived': sql = this._buildArchivedSQL(); break;
  //   }
  //
  //   // hack: sql replace
  //   const cond = `where t1.id in (${funnelIssueIds.join(',')}) and`;
  //   const query = sql.issuesQuery.replace('where', cond);
  //   const {rows} = await DBIPC.select(query);
  //   return rows;
  // }

  // async readAll(streamName) {
  //   let sql;
  //   switch (streamName) {
  //     case 'Inbox': sql = this._buildInboxSQL(); break;
  //     case 'Unread': sql = this._buildUnreadSQL(); break;
  //     case 'Marked': sql = this._buildMarkedSQL(); break;
  //     case 'Open': sql = this._buildOpenSQL(); break;
  //     case 'Archived': sql = this._buildArchivedSQL(); break;
  //   }
  //
  //   const date = new Date();
  //   const readAt = moment(date).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
  //   await DBIPC.exec(sql.readQuery, [readAt]);
  // }

  // _buildInboxSQL() {
  //   const issuesQuery = `
  //     select distinct
  //       t1.*
  //     from
  //       issues as t1
  //     inner join
  //       streams_issues as t2 on t1.id = t2.issue_id
  //     where
  //       archived_at is null
  //     order by
  //       updated_at desc
  //   `;
  //
  //   const countQuery = `
  //     select
  //       count(1) as count
  //     from
  //       issues as t1
  //     inner join
  //       streams_issues as t2 on t1.id = t2.issue_id
  //     where
  //       archived_at is null
  //   `;
  //
  //   const readQuery = `
  //     update
  //       issues
  //     set
  //       read_at = ?,
  //       read_body = body,
  //       prev_read_body = read_body
  //     where
  //       archived_at is null
  //       and (read_at is null or read_at < updated_at)
  //       and id in (select issue_id from streams_issues)
  //   `;
  //
  //   return {issuesQuery, countQuery, readQuery};
  // }
  //
  // _buildUnreadSQL() {
  //   const issuesQuery = `
  //     select distinct
  //       t1.*
  //     from
  //       issues as t1
  //     inner join
  //       streams_issues as t2 on t1.id = t2.issue_id
  //     where
  //       ((read_at is null) or (updated_at > read_at))
  //       and archived_at is null
  //     order by
  //       updated_at desc
  //   `;
  //
  //   const countQuery = `
  //     select
  //       count(1) as count
  //     from
  //       issues as t1
  //     inner join
  //       streams_issues as t2 on t1.id = t2.issue_id
  //     where
  //       ((read_at is null) or (updated_at > read_at))
  //       and archived_at is null
  //   `;
  //
  //   const readQuery = `
  //     update
  //       issues
  //     set
  //       read_at = ?,
  //       read_body = body,
  //       prev_read_body = read_body
  //     where
  //       (read_at is null or read_at < updated_at)
  //       and archived_at is null
  //       and id in (select issue_id from streams_issues)
  //   `;
  //
  //   return {issuesQuery, countQuery, readQuery};
  // }
  //
  // _buildMarkedSQL() {
  //   const issuesQuery = `
  //     select distinct
  //       t1.*
  //     from
  //       issues as t1
  //     inner join
  //       streams_issues as t2 on t1.id = t2.issue_id
  //     where
  //       marked_at is not null
  //       and archived_at is null
  //     order by
  //       updated_at desc
  //   `;
  //
  //   const countQuery = `
  //     select
  //       count(1) as count
  //     from
  //       issues as t1
  //     inner join
  //       streams_issues as t2 on t1.id = t2.issue_id
  //     where
  //       marked_at is not null
  //       and archived_at is null
  //   `;
  //
  //   const readQuery = `
  //     update
  //       issues
  //     set
  //       read_at = ?,
  //       read_body = body,
  //       prev_read_body = read_body
  //     where
  //       (read_at is null or read_at < updated_at)
  //       and marked_at is not null
  //       and archived_at is null
  //       and id in (select issue_id from streams_issues)
  //   `;
  //
  //   return {issuesQuery, countQuery, readQuery};
  // }
  //
  // _buildOpenSQL() {
  //   const issuesQuery = `
  //     select distinct
  //       t1.*
  //     from
  //       issues as t1
  //     inner join
  //       streams_issues as t2 on t1.id = t2.issue_id
  //     where
  //       closed_at is null
  //       and archived_at is null
  //     order by
  //       updated_at desc
  //   `;
  //
  //   const countQuery = `
  //     select
  //       count(1) as count
  //     from
  //       issues as t1
  //     inner join
  //       streams_issues as t2 on t1.id = t2.issue_id
  //     where
  //       closed_at is null
  //       and archived_at is null
  //   `;
  //
  //   const readQuery = `
  //     update
  //       issues
  //     set
  //       read_at = ?,
  //       read_body = body,
  //       prev_read_body = read_body
  //     where
  //       closed_at is null
  //       and archived_at is null
  //       and id in (select issue_id from streams_issues)
  //   `;
  //
  //   return {issuesQuery, countQuery, readQuery};
  // }
  //
  // _buildArchivedSQL() {
  //   const issuesQuery = `
  //     select distinct
  //       t1.*
  //     from
  //       issues as t1
  //     inner join
  //       streams_issues as t2 on t1.id = t2.issue_id
  //     where
  //       archived_at is not null
  //     order by
  //       archived_at desc
  //   `;
  //
  //   const countQuery = `
  //     select
  //       count(1) as count
  //     from
  //       issues as t1
  //     inner join
  //       streams_issues as t2 on t1.id = t2.issue_id
  //     where
  //       archived_at is not null
  //   `;
  //
  //   const readQuery = `
  //     update
  //       issues
  //     set
  //       read_at = ?,
  //       read_body = body,
  //       prev_read_body = read_body
  //     where
  //       (read_at is null or read_at < updated_at)
  //       and archived_at is not null
  //       and id in (select issue_id from streams_issues)
  //   `;
  //
  //   return {issuesQuery, countQuery, readQuery};
  // }
// }
//
// export const LibraryIssue = new _LibraryIssue();
