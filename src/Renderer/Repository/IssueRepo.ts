import {DBIPC} from '../../IPC/DBIPC';
import {ConfigRepo} from './ConfigRepo';
import {IssueEvent} from '../Event/IssueEvent';
import {IssueEntity} from '../Type/IssueEntity';
import {RemoteIssueEntity} from '../Type/RemoteIssueEntity';
import {GitHubUtil} from '../Util/GitHubUtil';
import {StreamIssueRepo} from './StreamIssueRepo';
import {DateUtil} from '../Util/DateUtil';
import {FilterSQLRepo} from './FilterSQLRepo';

class _IssueRepo {
  private async relations(issues: IssueEntity[]) {
    for (const issue of issues) issue.value = JSON.parse(issue.value as any);
  }

  async getIssues(issueIds: number[]): Promise<{error?: Error; issues?: IssueEntity[]}> {
    const {error, rows: issues} = await DBIPC.select<IssueEntity>(`select * from issues where id in (${issueIds.join(',')})`);
    if (error) return {error};

    await this.relations(issues);
    return {issues};
  }

  async getIssue(issueId: number): Promise<{error?: Error; issue?: IssueEntity}> {
    const {error, issues} = await this.getIssues([issueId]);
    if (error) return {error};

    return {issue: issues[0]};
  }

  // todo: libraryStreamもidを持つようになったので、それの対応
  async getIssuesInStream(streamId: number | null, defaultFilter: string, userFilter: string, page: number = 0, perPage = 30): Promise<{error?: Error; issues?: IssueEntity[]; totalCount?: number; hasNextPage?: boolean}> {
    const filter = `${userFilter} ${defaultFilter}`;
    const {issuesSQL, countSQL} = await this.buildSQL(streamId, filter, page, perPage);

    const {error: e1, rows: issues} = await DBIPC.select<IssueEntity>(issuesSQL);
    if (e1) return {error: e1};

    const {error: e2, row: countRow} = await DBIPC.selectSingle<{count: number}>(countSQL);
    if (e2) return {error: e2};

    const hasNextPage = page * perPage + perPage < countRow.count;
    await this.relations(issues);
    return {issues, totalCount: countRow.count, hasNextPage};
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

  async getUnreadCountInStream(streamId: number | null, defaultFilter: string, userFilter: string = ''): Promise<{error?: Error; count?: number}> {
    const filter = `${userFilter} ${defaultFilter}`;
    const {unreadCountSQL} = await this.buildSQL(streamId, filter, 0, 0);

    const {error, row: countRow} = await DBIPC.selectSingle<{count: number}>(unreadCountSQL);
    if (error) return {error};

    return {count: countRow.count};
  }

  async getIncludeIds(issueIds: number[], streamId: number | null, defaultFilter: string, userFilter: string = ''): Promise<{error?: Error; issueIds?: number[]}> {
    const cond = FilterSQLRepo.getSQL(`${userFilter} ${defaultFilter}`);
    const sql = `
      select
        id
      from
        issues
      where
        ${cond.filter}
        ${streamId !== null ? `and id in (select issue_id from streams_issues where stream_id = ${streamId})` : ''}
        and id in (${issueIds.join(',')})
    `;
    const {error, rows} = await DBIPC.select<{id: number}>(sql);
    if (error) return {error};

    const includedIssueIds = rows.map(row => row.id);
    return {issueIds: includedIssueIds};
  }

  isRead(issue: IssueEntity): boolean {
    return issue && issue.read_at !== null && issue.read_at >= issue.updated_at;
  }

  async createBulk(streamId: number, issues: RemoteIssueEntity[]): Promise<{error?: Error; updatedIssueIds?: number[]}> {
    const updatedIds = [];

    for (const issue of issues) {
      const {repo, user} = GitHubUtil.getInfo(issue.url);
      const res = await this.getIssue(issue.id);
      if (res.error) return {error: res.error};
      const currentIssue = res.issue;
      const params = [
        issue.id,
        issue.pull_request ? 'pr' : 'issue',
        issue.title,
        issue.created_at,
        issue.updated_at,
        issue.closed_at || null,
        currentIssue?.read_at || null,
        issue.number,
        user,
        repo,
        issue.user.login, // author
        issue.assignees.length ? issue.assignees.map((assignee)=> `<<<<${assignee.login}>>>>`).join('') : null, // hack: assignees format
        issue.labels.length ? issue.labels.map((label)=> `<<<<${label.name}>>>>`).join('') : null, // hack: labels format
        issue.milestone?.title || null,
        issue.milestone?.due_on || null,
        issue.html_url,
        issue.body,
        JSON.stringify(issue)
      ];

      if (currentIssue) {
        const {error} = await DBIPC.exec(`
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

        if (error) return {error};
        if (issue.updated_at > currentIssue.updated_at) updatedIds.push(issue.id);
      } else {
        const {error} = await DBIPC.exec(`
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

        if (error) return {error};
        updatedIds.push(issue.id);
      }
    }

    // limit max records
    const max = ConfigRepo.getConfig().database.max;
    await DBIPC.exec(`delete from issues where id in (select id from issues order by updated_at desc limit ${max}, 1000)`);

    // create stream-issue
    const issueIds = issues.map(issue => issue.id);
    const res = await this.getIssues(issueIds);
    if (res.error) return {error: res.error};
    const {error} = await StreamIssueRepo.createBulk(streamId, res.issues);
    if (error) return {error};

    return {updatedIssueIds: updatedIds};
  }

  async updateRead(issueId: number, date: Date): Promise<{error?: Error; issue?: IssueEntity}> {
    if (date) {
      const readAt = DateUtil.localToUTCString(date);
      const {error} = await DBIPC.exec(
        `update issues set read_at = ?, prev_read_at = read_at, read_body = body, prev_read_body = read_body where id = ?`,
        [readAt, issueId]
      );
      if (error) return {error};
    } else {
      const {error} = await DBIPC.exec(
        `update issues set read_at = prev_read_at, prev_read_at = null, read_body = prev_read_body, prev_read_body = null where id = ?`,
        [issueId]
      );
      if (error) return {error};

      const {error: e2, issue} = await this.getIssue(issueId);
      if (e2) return {error: e2};
      if (this.isRead(issue)) {
        await DBIPC.exec(`update issues set read_at = prev_read_at, prev_read_at = null where id = ?`, [issueId]);
      }
    }

    const {error, issue} = await this.getIssue(issueId);
    if (error) return {error};
    IssueEvent.emitReadIssue(issue);
    return {issue};
  }

  async updateReads(issueIds: number[], date: Date): Promise<{error?: Error; issues?: IssueEntity[]}> {
    const readAt = DateUtil.localToUTCString(date);
    const {error} = await DBIPC.exec(`
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
    if (error) return {error};

    const {error: error2, issues} = await this.getIssues(issueIds);
    if (error2) return {error: error2};

    return {issues};
  }

  async updateReadAll(streamId: number | null, defaultFilter: string, userFilter: string =''): Promise<{error?: Error}> {
    const readAt = DateUtil.localToUTCString(new Date());
    const cond = FilterSQLRepo.getSQL(`${userFilter} ${defaultFilter}`);
    const sql = `
      update
        issues
      set
        read_at = ?,
        read_body = body,
        prev_read_body = read_body
      where
        (read_at is null or read_at < updated_at)
        and ${cond.filter}
        ${streamId !== null ? `and id in (select issue_id from streams_issues where stream_id = ${streamId})` : ''}
    `;

    const {error} = await DBIPC.exec(sql, [readAt])
    if (error) return {error};

    return {};
  }

  async updateMark(issueId: number, date: Date): Promise<{error?: Error; issue?: IssueEntity}> {
    if (date) {
      const markedAt = DateUtil.localToUTCString(date);
      const {error} = await DBIPC.exec('update issues set marked_at = ? where id = ?', [markedAt, issueId]);
      if (error) return {error};
    } else {
      const {error} = await DBIPC.exec('update issues set marked_at = null where id = ?', [issueId]);
      if (error) return {error};
    }

    const {error, issue} = await this.getIssue(issueId);
    if (error) return {error};

    return {issue};
  }

  async updateArchive(issueId: number, date: Date): Promise<{error?: Error; issue?: IssueEntity}> {
    if (date) {
      const archivedAt = DateUtil.localToUTCString(date);
      const {error} = await DBIPC.exec('update issues set archived_at = ? where id = ?', [archivedAt, issueId]);
      if (error) return {error};
    } else {
      const {error} = await DBIPC.exec('update issues set archived_at = null where id = ?', [issueId]);
      if (error) return {error};
    }

    const {error, issue} = await this.getIssue(issueId);
    if (error) return {error};

    return {issue};
  }

  private async buildSQL(streamId: number, filter: string, page: number, perPage: number): Promise<{issuesSQL: string; countSQL: string; unreadCountSQL: string}> {
    const cond = FilterSQLRepo.getSQL(filter);
    const wheres: string[] = [];
    if (cond.filter) wheres.push(cond.filter);
    // todo: stream_idは`in`じゃなくて`inner join`のほうが早いかも?
    // if (streamId !== null) wheres.push(`stream_id = ${streamId}`);
    if (streamId !== null) wheres.push(`id in (select issue_id from streams_issues where stream_id = ${streamId})`);
    const where = wheres.join(' and ');

    return {
      issuesSQL: this.buildIssuesSQL(where, cond.sort, page, perPage),
      countSQL: this.buildCountSQL(where),
      unreadCountSQL: this.buildUnreadCountSQL(where),
    };
  }

  private buildIssuesSQL(where: string, sortSQL, page: number, perPage: number): string {
    return `
      select
        *
      from
        issues
      where
        ${where}
      order by
        ${sortSQL ? sortSQL : 'updated_at desc'}
      limit
        ${page * perPage}, ${perPage}
    `;
  }

  private buildCountSQL(where: string): string {
    return `
      select
        count(1) as count
      from
        issues
      where
        ${where}
    `;
  }

  private buildUnreadCountSQL(where: string): string {
    return `
      select
        count(1) as count
      from
        issues
      where
        ${where}
        and ((read_at is null) or (updated_at > read_at))
    `;
  }
}

export const IssueRepo = new _IssueRepo();
