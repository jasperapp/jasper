import {UserPrefRepo} from './UserPrefRepo';
import {IssueEntity} from '../Library/Type/IssueEntity';
import {RemoteIssueEntity} from '../Library/Type/RemoteGitHubV3/RemoteIssueEntity';
import {GitHubUtil} from '../Library/Util/GitHubUtil';
import {StreamIssueRepo} from './StreamIssueRepo';
import {DateUtil} from '../Library/Util/DateUtil';
import {FilterSQLRepo} from './FilterSQLRepo';
import {DB} from '../Library/Infra/DB';
import {StreamEntity} from '../Library/Type/StreamEntity';
import {RepositoryEntity} from '../Library/Type/RepositoryEntity';
import {RemoteGitHubV4IssueEntity} from '../Library/Type/RemoteGitHubV4/RemoteGitHubV4IssueNodesEntity';
import {GitHubV4IssueClient} from '../Library/GitHub/V4/GitHubV4IssueClient';

class _IssueRepo {
  private async relations(issues: IssueEntity[]) {
    for (const issue of issues) issue.value = JSON.parse(issue.value as any);
  }

  async getIssues(issueIds: number[]): Promise<{error?: Error; issues?: IssueEntity[]}> {
    const {error, rows: issues} = await DB.select<IssueEntity>(`select * from issues where id in (${issueIds.join(',')})`);
    if (error) return {error};

    await this.relations(issues);
    return {issues};
  }

  async getIssue(issueId: number): Promise<{error?: Error; issue?: IssueEntity}> {
    const {error, issues} = await this.getIssues([issueId]);
    if (error) return {error};

    return {issue: issues[0]};
  }

  async getIssueByIssueNumber(repo: string, issueNumber: number): Promise<{error?: Error; issue?: IssueEntity}> {
    const {error, row: issue} = await DB.selectSingle<IssueEntity>(`select * from issues where repo = ? and number = ?`, [repo, issueNumber]);
    if (error) return {error};
    if (!issue) return {issue: null};

    await this.relations([issue]);
    return {issue};
  }

  async getIssuesInStream(queryStreamId: number | null, defaultFilter: string, userFilter: string, page: number = 0, perPage = 30): Promise<{error?: Error; issues?: IssueEntity[]; totalCount?: number; hasNextPage?: boolean}> {
    const filter = `${userFilter} ${defaultFilter}`;
    const {issuesSQL, countSQL} = await this.buildSQL(queryStreamId, filter, page, perPage);

    const {error: e1, rows: issues} = await DB.select<IssueEntity>(issuesSQL);
    if (e1) return {error: e1};

    const {error: e2, row: countRow} = await DB.selectSingle<{count: number}>(countSQL);
    if (e2) return {error: e2};

    const hasNextPage = page * perPage + perPage < countRow.count;
    await this.relations(issues);
    return {issues, totalCount: countRow.count, hasNextPage};
  }

  async getRecentlyIssues(): Promise<{error?: Error; issues?: IssueEntity[]}> {
    const {error, rows: issues} = await DB.select<IssueEntity>(`select * from issues order by updated_at desc limit 100`);
    if (error) return {error};

    await this.relations(issues);
    return {issues};
  }

  async getTotalCount(): Promise<{error?: Error; count?: number}>{
    const {error, row} = await DB.selectSingle<{count: number}>('select count(1) as count from issues');
    if (error) return {error};
    return {count: row.count};
  }

  async getTotalUnreadCount(): Promise<{error?: Error; count?: number}> {
    const {error, row} = await DB.selectSingle<{count: number}>(`
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

    const {error, row: countRow} = await DB.selectSingle<{count: number}>(unreadCountSQL);
    if (error) return {error};

    return {count: countRow.count};
  }

  async getIncludeIds(issueIds: number[], queryStreamId: StreamEntity['queryStreamId'], defaultFilter: string, userFilter: string = ''): Promise<{error?: Error; issueIds?: number[]}> {
    const cond = FilterSQLRepo.getSQL(`${userFilter} ${defaultFilter}`);
    const sql = `
      select
        id
      from
        issues
      where
        ${cond.filter}
        ${queryStreamId !== null ? `and id in (select issue_id from streams_issues where stream_id = ${queryStreamId})` : ''}
        and id in (${issueIds.join(',')})
    `;
    const {error, rows} = await DB.select<{id: number}>(sql);
    if (error) return {error};

    const includedIssueIds = rows.map(row => row.id);
    return {issueIds: includedIssueIds};
  }

  isRead(issue: IssueEntity): boolean {
    return issue && issue.read_at !== null && issue.read_at >= issue.updated_at;
  }

  async createBulk(streamId: number, issues: RemoteIssueEntity[], markAdReadIfOldIssue: boolean = false): Promise<{error?: Error; updatedIssueIds?: number[]}> {
    const updatedIds = [];

    for (const issue of issues) {
      const {repo, user} = GitHubUtil.getInfo(issue.url);
      const res = await this.getIssue(issue.id);
      if (res.error) return {error: res.error};
      const currentIssue = res.issue;

      let readAt = null;
      if (markAdReadIfOldIssue && !currentIssue) {
        const fromNow = Date.now() - new Date(issue.updated_at).getTime();
        if (fromNow >= 7 * 24 * 60 * 60 * 1000) { // 更新が7日前の場合、既読扱いとする
          readAt = issue.updated_at;
        }
      }

      const params = [
        issue.id,
        issue.node_id,
        issue.pull_request ? 'pr' : 'issue',
        issue.title,
        issue.created_at,
        issue.updated_at,
        issue.closed_at || null,
        issue.merged_at || null,
        currentIssue?.read_at || readAt || null,
        issue.number,
        user,
        repo,
        issue.user.login, // author
        issue.assignees.length ? issue.assignees.map((assignee)=> `<<<<${assignee.login}>>>>`).join('') : null, // hack: assignees format
        issue.labels.length ? issue.labels.map((label)=> `<<<<${label.name}>>>>`).join('') : null, // hack: labels format
        issue.milestone?.title || null,
        issue.milestone?.due_on || null,
        issue.draft ? 1 : 0,
        issue.private ? 1 : 0,
        issue.involves?.length ? issue.involves.map(user => `<<<<${user.login}>>>>`).join('') : null, // hack: involves format
        issue.requested_reviewers?.length ? issue.requested_reviewers.map(user => `<<<<${user.login}>>>>`).join('') : null, // hack: review_requested format
        issue.reviews?.length ? issue.reviews.map(user => `<<<<${user.login}>>>>`).join('') : null, // hack: reviews format
        issue.projects?.length ? issue.projects.map(project => `<<<<${project.url}>>>>`).join('') : null, // hack: project_urls format
        issue.projects?.length ? issue.projects.map(project => `<<<<${project.name}>>>>`).join('') : null, // hack: project_names format
        issue.projects?.length ? issue.projects.map(project => `<<<<${project.column}>>>>`).join('') : null, // hack: project_columns format
        issue.last_timeline_user || currentIssue?.last_timeline_user,
        issue.last_timeline_at || currentIssue?.last_timeline_at,
        issue.html_url,
        issue.body,
        JSON.stringify(issue)
      ];

      if (currentIssue) {
        const {error} = await DB.exec(`
          update
            issues
          set
            id = ?,
            node_id = ?,
            type = ?,
            title = ?,
            created_at = ?,
            updated_at = ?,
            closed_at = ?,
            merged_at = ?,
            read_at = ?,
            number = ?,
            user = ?,
            repo = ?,
            author = ?,
            assignees = ?,
            labels = ?,
            milestone = ?,
            due_on = ?,
            draft = ?,
            repo_private = ?,
            involves = ?,
            review_requested = ?,
            reviews = ?,
            project_urls = ?,
            project_names = ?,
            project_columns = ?,
            last_timeline_user = ?,
            last_timeline_at = ?,
            html_url = ?,
            body = ?,
            value = ?
          where
            id = ${issue.id}
        `, params);

        if (error) return {error};
        if (issue.updated_at > currentIssue.updated_at) updatedIds.push(issue.id);
      } else {
        const {error} = await DB.exec(`
          insert into
            issues
            (
              id,
              node_id,
              type,
              title,
              created_at,
              updated_at,
              closed_at,
              merged_at,
              read_at,
              number,
              user,
              repo,
              author,
              assignees,
              labels,
              milestone,
              due_on,
              draft,
              repo_private,
              involves,
              review_requested,
              reviews,
              project_urls,
              project_names,
              project_columns,
              last_timeline_user,
              last_timeline_at,
              html_url,
              body,
              value
            )
          values
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, params);

        if (error) return {error};
        updatedIds.push(issue.id);
      }
    }

    // limit max records
    const max = UserPrefRepo.getPref().database.max;
    await DB.exec(`delete from issues where id in (select id from issues order by updated_at desc limit ${max}, 1000)`);

    // create stream-issue
    const issueIds = issues.map(issue => issue.id);
    const res = await this.getIssues(issueIds);
    if (res.error) return {error: res.error};
    const {error} = await StreamIssueRepo.createBulk(streamId, res.issues);
    if (error) return {error};

    return {updatedIssueIds: updatedIds};
  }

  async updateWithV4(v4Issues: RemoteGitHubV4IssueEntity[]): Promise<{error?: Error}> {
    if (!v4Issues.length) return {};

    const nodeIds = v4Issues.map(v4Issue => `"${v4Issue.node_id}"`);
    const {error, rows: issues} = await DB.select<IssueEntity>(`select * from issues where node_id in (${nodeIds.join(',')})`);
    if (error) return {error};

    const v3Issues = issues.map<RemoteIssueEntity>(issue => JSON.parse(issue.value as any));
    GitHubV4IssueClient.injectV4ToV3(v4Issues, v3Issues);

    for (const v3Issue of v3Issues) {
      const currentIssue = issues.find(issue => issue.id === v3Issue.id);
      const params = [
        v3Issue.merged_at || null,
        v3Issue.draft ? 1 : 0,
        v3Issue.private ? 1 : 0,
        v3Issue.involves?.length ? v3Issue.involves.map(user => `<<<<${user.login}>>>>`).join('') : null, // hack: involves format
        v3Issue.requested_reviewers?.length ? v3Issue.requested_reviewers.map(user => `<<<<${user.login}>>>>`).join('') : null, // hack: review_requested format
        v3Issue.reviews?.length ? v3Issue.reviews.map(user => `<<<<${user.login}>>>>`).join('') : null, // hack: reviews format
        v3Issue.projects?.length ? v3Issue.projects.map(project => `<<<<${project.url}>>>>`).join('') : null, // hack: project_urls format
        v3Issue.projects?.length ? v3Issue.projects.map(project => `<<<<${project.name}>>>>`).join('') : null, // hack: project_names format
        v3Issue.projects?.length ? v3Issue.projects.map(project => `<<<<${project.column}>>>>`).join('') : null, // hack: project_columns format
        v3Issue.last_timeline_user || currentIssue?.last_timeline_user,
        v3Issue.last_timeline_at || currentIssue?.last_timeline_at,
        JSON.stringify(v3Issue)
      ];

      const {error} = await DB.exec(`
          update
            issues
          set
            merged_at = ?,
            draft = ?,
            repo_private = ?,
            involves = ?,
            review_requested = ?,
            reviews = ?,
            project_urls = ?,
            project_names = ?,
            project_columns = ?,
            last_timeline_user = ?,
            last_timeline_at = ?,
            value = ?
          where
            id = ${v3Issue.id}
        `, params);
      if (error) return {error};
    }

    return {};
  }

  async updateRead(issueId: number, date: Date): Promise<{error?: Error; issue?: IssueEntity}> {
    if (date) {
      const readAt = DateUtil.localToUTCString(date);
      const {error} = await DB.exec(
        `update issues set read_at = ?, prev_read_at = read_at, read_body = body, prev_read_body = read_body where id = ?`,
        [readAt, issueId]
      );
      if (error) return {error};
    } else {
      const {error: e1, issue: currentIssue} = await this.getIssue(issueId);
      if (e1) return {error: e1};

      // prev_read_atをnullではなくupdated_atの直前にすることで、すべてのコメントが未読とならないようにする
      const currentUpdatedAt = new Date(currentIssue.updated_at);
      const prevReadAt = DateUtil.localToUTCString(new Date(currentUpdatedAt.getTime() - 1000));

      const {error} = await DB.exec(
        `update issues set read_at = prev_read_at, prev_read_at = ?, read_body = prev_read_body, prev_read_body = null where id = ?`,
        [prevReadAt, issueId]
      );
      if (error) return {error};

      const {error: e2, issue} = await this.getIssue(issueId);
      if (e2) return {error: e2};
      if (this.isRead(issue)) {
        await DB.exec(`update issues set read_at = prev_read_at, prev_read_at = null where id = ?`, [issueId]);
      }
    }

    const {error, issue} = await this.getIssue(issueId);
    if (error) return {error};
    return {issue};
  }

  async updateReads(issueIds: number[], date: Date): Promise<{error?: Error; issues?: IssueEntity[]}> {
    const readAt = DateUtil.localToUTCString(date);
    const {error} = await DB.exec(`
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

  async updateReadAll(queryStreamId: number | null, defaultFilter: string, userFilter: string =''): Promise<{error?: Error}> {
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
        ${queryStreamId !== null ? `and id in (select issue_id from streams_issues where stream_id = ${queryStreamId})` : ''}
    `;

    const {error} = await DB.exec(sql, [readAt])
    if (error) return {error};

    return {};
  }

  async updateMark(issueId: number, date: Date): Promise<{error?: Error; issue?: IssueEntity}> {
    if (date) {
      const markedAt = DateUtil.localToUTCString(date);
      const {error} = await DB.exec('update issues set marked_at = ? where id = ?', [markedAt, issueId]);
      if (error) return {error};
    } else {
      const {error} = await DB.exec('update issues set marked_at = null where id = ?', [issueId]);
      if (error) return {error};
    }

    const {error, issue} = await this.getIssue(issueId);
    if (error) return {error};

    return {issue};
  }

  async updateArchive(issueId: number, date: Date): Promise<{error?: Error; issue?: IssueEntity}> {
    if (date) {
      const archivedAt = DateUtil.localToUTCString(date);
      const {error} = await DB.exec('update issues set archived_at = ? where id = ?', [archivedAt, issueId]);
      if (error) return {error};
    } else {
      const {error} = await DB.exec('update issues set archived_at = null where id = ?', [issueId]);
      if (error) return {error};
    }

    const {error, issue} = await this.getIssue(issueId);
    if (error) return {error};

    return {issue};
  }

  async updateMerged(issueId: number, mergedAt: string): Promise<{error?: Error; issue?: IssueEntity}> {
    const {error: e1} = await DB.exec('update issues set merged_at = ? where id = ?', [mergedAt, issueId]);
    if (e1) return {error: e1};

    const {error: e2, issue} = await this.getIssue(issueId);
    if (e2) return {error: e2};

    return {issue};
  }

  private async buildSQL(streamId: number, filter: string, page: number, perPage: number): Promise<{issuesSQL: string; countSQL: string; unreadCountSQL: string}> {
    const cond = FilterSQLRepo.getSQL(filter);
    const wheres: string[] = [];
    if (cond.filter) wheres.push(cond.filter);
    // todo: stream_idは`in`じゃなくて`inner join`のほうが早いかも?
    // if (streamId !== null) wheres.push(`stream_id = ${streamId}`);
    if (streamId !== null) {
      wheres.push(`id in (select issue_id from streams_issues where stream_id = ${streamId})`);
    } else {
      wheres.push(`id in (select issue_id from streams_issues)`);
    }
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

  async getAllRepositories(): Promise<{error?: Error; repositories?: RepositoryEntity[]}> {
    const {error, rows} = await DB.select<{repo: string}>('select repo from issues group by repo order by count(1) desc;');
    if (error) return {error};

    const repositories = rows.map((row, index) => ({id: index, fullName: row.repo}));
    return {repositories};
  }
}

export const IssueRepo = new _IssueRepo();
