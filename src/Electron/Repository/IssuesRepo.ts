import {DBIPC} from '../../IPC/DBIPC';
import {Config} from '../Config';

class _IssuesRepo {
  async unreadCount(): Promise<{error?: Error; count?: number}> {
    const result = await DBIPC.selectSingle(`
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
    return {count: result.row.count};
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
    const max = Config.getConfig().database.max;
    await DBIPC.exec(`
      delete from
        issues
      where
        id in (select id from issues order by updated_at desc limit ${max}, 1000)
    `);

    return {updatedIssueIds: updatedIds};
  }
}

export const IssuesRepo = new _IssuesRepo();
