import moment from 'moment';
import {IssueEmitter} from './IssueEmitter';
import Issue from './Issue/Issue';
import LibraryIssue from './Issue/LibraryIssue';
import IssueFilter from './Issue/IssueFilter';
import {RemoteDB as DB} from './Remote';

class _IssueCenter {
  isRead(issue) {
    return issue && issue.read_at !== null && issue.read_at >= issue.updated_at;
  }

  async findIssue(issueId) {
    const issue = await DB.selectSingle('select * from issues where id = ?', [issueId]);
    const value = JSON.parse(issue.value);

    // todo: this hack is for old github response
    // we must add value.assignee before `issue.value = value`.
    // because issue.value is setter/getter, so setter behavior is special.
    if (!value.assignees) {
      value.assignees = value.assignee ? [value.assignee] : [];
    }

    issue.value = value;

    return issue;
  }

  async findIssuesByIds(issueIds, suppressSlowQueryLog) {
    const issues = await DB.select(`
      select
        *
      from
        issues
      where
        id in (${issueIds.join(',')}) and
        archived_at is null
    `, null, suppressSlowQueryLog);

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

    return issues;
  }

  async findIssues(streamId, filterQuery, pageNumber, perPage = 30) {
    return await Issue.findIssues(streamId, filterQuery, pageNumber, perPage);
  }

  async findIssuesFromLibrary(libraryName, filterQuery, pageNumber, perPage = 30) {
    return await LibraryIssue.findIssues(libraryName, filterQuery, pageNumber, perPage);
  }

  async update(issueId, date) {
    const updatedAt = moment(date).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
    await DB.exec(`update issues set updated_at = ? where id = ?`, [updatedAt, issueId]);
  }

  async read(issueId, date) {
    if (date) {
      const readAt = moment(date).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
      await DB.exec(`
        update issues set
          read_at = ?,
          prev_read_at = read_at,
          read_body = body,
          prev_read_body = read_body
        where id = ?`,
      [readAt, issueId]);
    } else {
      await DB.exec(`
        update issues set
          read_at = prev_read_at,
          prev_read_at = null,
          read_body = prev_read_body,
          prev_read_body = null
        where id = ?`,
      [issueId]);
      const _issue = await this.findIssue(issueId);
      if (this.isRead(_issue)) await DB.exec(`update issues set read_at = prev_read_at, prev_read_at = null where id = ?`, [issueId]);
    }

    const issue = await this.findIssue(issueId);
    IssueEmitter.emitReadIssue(issue);
    return issue;
  }

  async mark(issueId, date) {
    if (date) {
      const markedAt = moment(date).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
      await DB.exec('update issues set marked_at = ? where id = ?', [markedAt, issueId]);
    } else {
      await DB.exec('update issues set marked_at = null where id = ?', [issueId]);
    }

    const issue = await this.findIssue(issueId);

    IssueEmitter.emitMarkIssue(issue);

    return issue;
  }

  async archive(issueId, date) {
    if (date) {
      const archivedAt = moment(date).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
      await DB.exec('update issues set archived_at = ? where id = ?', [archivedAt, issueId]);
    } else {
      await DB.exec('update issues set archived_at = null where id = ?', [issueId]);
    }

    const issue = await this.findIssue(issueId);

    IssueEmitter.emitArchiveIssue(issue);

    return issue;
  }

  async readAll(streamId, filter = null) {
    const date = new Date();
    const readAt = moment(date).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');

    let filterCondition = '';
    if (filter) {
      const tmp = IssueFilter.buildCondition(filter);
      filterCondition = `and ${tmp.filter}`;
    }

    await DB.exec(`
      update
        issues
      set
        read_at = ?,
        read_body = body,
        prev_read_body = read_body
      where
        id in (select issue_id from streams_issues where stream_id = ?) and
        (read_at is null or read_at < updated_at) and
        archived_at is null
        ${filterCondition}
    `, [readAt, streamId]);

    IssueEmitter.emitReadAllIssues(streamId);
  }

  async readIssues(issueIds) {
    const date = new Date();
    const readAt = moment(date).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
    await DB.exec(`
      update
        issues
      set
        read_at = ?,
        read_body = body,
        prev_read_body = read_body
      where
        id in (${issueIds.join(',')}) and
        (read_at is null or read_at < updated_at)
    `, [readAt]);

    IssueEmitter.emitReadIssues(issueIds);
  }

  async readAllFromLibrary(streamName) {
    await LibraryIssue.readAll(streamName);
    IssueEmitter.emitReadAllIssuesFromLibrary(streamName);
  }

  async includeIds(streamId, issueIds, filter = null) {
    return await Issue.includeIds(streamId, issueIds, filter);
  }

  async cleanupIssues() {
    // unreferenced issues
    const issues = await DB.select(`
      select
        t1.id as id
      from
        issues as t1
      left join
        streams_issues as t2 on t1.id = t2.issue_id
      where
        stream_id is null;
    `);

    const issueIds = issues.map((issue) => issue.id);
    await DB.exec(`
      delete from
        issues
      where
        id in (${issueIds.join(',')})
    `);
  }
}

export const IssueCenter = new _IssueCenter();
