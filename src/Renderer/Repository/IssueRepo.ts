import {DBIPC} from '../../IPC/DBIPC';
import {ConfigRepo} from './ConfigRepo';
import {Issue} from './Issue/Issue';
import {LibraryIssue} from './Issue/LibraryIssue';
import moment from 'moment';
import {IssueEvent} from '../Event/IssueEvent';
import {IssueFilter} from './Issue/IssueFilter';
import {IssueEntity} from '../Type/IssueEntity';

// todo: refactor
class _IssueRepo {
  async getIssues(streamId: number): Promise<{error?: Error; issues?: IssueEntity[]}> {
    const {error, rows} = await DBIPC.select<IssueEntity>(`
      select
        t1.*
      from
        issues as t1
      inner join
        streams_issues as t2 on t1.id = t2.issue_id
      where
        t2.stream_id = ?
    `, [streamId]);

    if (error) return {error};

    return {issues: rows};
  }

  async getTotalCount(): Promise<{error?: Error; count?: number}>{
    const {error, row} = await DBIPC.selectSingle('select count(1) as count from issues');
    if (error) return {error};
    return {count: row.count};
  }

  async getTotalUnreadCount(): Promise<{error?: Error; count?: number}> {
    const {error, row} = await DBIPC.selectSingle<{count: number}>(`
        select
          count(distinct t1.id) as count
        from
          issues as t1
        inner join
          streams_issues as t2 on t1.id = t2.issue_id
        where
          ((read_at is null) or (updated_at > read_at))
          and archived_at is null
      `);
    if (error) return {error};

    return {count: row.count};
  }

  async import(issues: any[], defaultReadAt: string = null): Promise<{error?: Error; updatedIssueIds?: number[]}> {
    const updatedIds = [];

    for (const issue of issues) {
      const paths = issue.url.split('/').reverse();
      const user = paths[3];
      const repo = `${paths[3]}/${paths[2]}`;

      if (!issue.assignees) {
        if (issue.assignee) {
          issue.assignees = [JSON.parse(JSON.stringify(issue.assignee))];
        } else {
          issue.assignees = [];
        }
      }

      const res = await DBIPC.selectSingle('select * from issues where id = ?', [issue.id]);
      const currentIssue = res.row;
      const params = [
        issue.id,
        issue.pull_request ? 'pr' : 'issue',
        issue.title,
        issue.created_at,
        issue.updated_at,
        issue.closed_at ? issue.closed_at : null,
        currentIssue ? currentIssue.read_at : defaultReadAt,
        issue.number,
        user,
        repo,
        issue.user.login, // author
        issue.assignees.length ? issue.assignees.map((assignee)=> `<<<<${assignee.login}>>>>`).join('') : null, // hack: assignees format
        issue.labels.length ? issue.labels.map((label)=> `<<<<${label.name}>>>>`).join('') : null, // hack: labels format
        issue.milestone ? issue.milestone.title : null,
        issue.milestone ? issue.milestone.due_on : null,
        issue.html_url,
        issue.body,
        JSON.stringify(issue)
      ];

      if (currentIssue) {
        await DBIPC.exec(`
          update
            issues
          set
            id = ?,
            type = ?,
            title = ?,
            created_at = ?,
            updated_at = ?,
            closed_at = ?,
            read_at = ?,
            number = ?,
            user = ?,
            repo = ?,
            author = ?,
            assignees = ?,
            labels = ?,
            milestone = ?,
            due_on = ?,
            html_url = ?,
            body = ?,
            value = ?
          where
            id = ${issue.id}
        `, params);

        if (issue.updated_at > currentIssue.updated_at) updatedIds.push(issue.id);
      } else {
        await DBIPC.exec(`
          insert into
            issues
            (
              id,
              type,
              title,
              created_at,
              updated_at,
              closed_at,
              read_at,
              number,
              user,
              repo,
              author,
              assignees,
              labels,
              milestone,
              due_on,
              html_url,
              body,
              value
            )
          values
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, params);

        if (!defaultReadAt) updatedIds.push(issue.id);
      }
    }

    // see StreamsIssuesTable
    const max = ConfigRepo.getConfig().database.max;
    await DBIPC.exec(`
      delete from
        issues
      where
        id in (select id from issues order by updated_at desc limit ${max}, 1000)
    `);

    return {updatedIssueIds: updatedIds};
  }

  isRead(issue) {
    return issue && issue.read_at !== null && issue.read_at >= issue.updated_at;
  }

  async findIssue(issueId) {
    const {row: issue} = await DBIPC.selectSingle('select * from issues where id = ?', [issueId]);
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

  async findIssuesByIds(issueIds, _suppressSlowQueryLog) {
    const {rows: issues} = await DBIPC.select(`
      select
        *
      from
        issues
      where
        id in (${issueIds.join(',')}) and
        archived_at is null
    `);

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
    await DBIPC.exec(`update issues set updated_at = ? where id = ?`, [updatedAt, issueId]);
  }

  async read(issueId, date) {
    if (date) {
      const readAt = moment(date).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
      await DBIPC.exec(`
        update issues set
          read_at = ?,
          prev_read_at = read_at,
          read_body = body,
          prev_read_body = read_body
        where id = ?`,
        [readAt, issueId]);
    } else {
      await DBIPC.exec(`
        update issues set
          read_at = prev_read_at,
          prev_read_at = null,
          read_body = prev_read_body,
          prev_read_body = null
        where id = ?`,
        [issueId]);
      const _issue = await this.findIssue(issueId);
      if (this.isRead(_issue)) await DBIPC.exec(`update issues set read_at = prev_read_at, prev_read_at = null where id = ?`, [issueId]);
    }

    const issue = await this.findIssue(issueId);
    IssueEvent.emitReadIssue(issue);
    return issue;
  }

  async mark(issueId, date) {
    if (date) {
      const markedAt = moment(date).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
      await DBIPC.exec('update issues set marked_at = ? where id = ?', [markedAt, issueId]);
    } else {
      await DBIPC.exec('update issues set marked_at = null where id = ?', [issueId]);
    }

    const issue = await this.findIssue(issueId);

    IssueEvent.emitMarkIssue(issue);

    return issue;
  }

  async archive(issueId, date) {
    if (date) {
      const archivedAt = moment(date).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
      await DBIPC.exec('update issues set archived_at = ? where id = ?', [archivedAt, issueId]);
    } else {
      await DBIPC.exec('update issues set archived_at = null where id = ?', [issueId]);
    }

    const issue = await this.findIssue(issueId);

    IssueEvent.emitArchiveIssue(issue);

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

    await DBIPC.exec(`
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

    IssueEvent.emitReadAllIssues(streamId);
  }

  async readIssues(issueIds) {
    const date = new Date();
    const readAt = moment(date).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
    await DBIPC.exec(`
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

    IssueEvent.emitReadIssues(issueIds);
  }

  async readAllFromLibrary(streamName) {
    await LibraryIssue.readAll(streamName);
    IssueEvent.emitReadAllIssuesFromLibrary(streamName);
  }

  async includeIds(streamId, issueIds, filter = null) {
    return await Issue.includeIds(streamId, issueIds, filter);
  }

  async cleanupIssues() {
    // unreferenced issues
    const {rows: issues} = await DBIPC.select(`
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
    await DBIPC.exec(`
      delete from
        issues
      where
        id in (${issueIds.join(',')})
    `);
  }
}

export const IssueRepo = new _IssueRepo();
