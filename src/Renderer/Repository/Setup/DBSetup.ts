import {DB} from '../../Library/Infra/DB';
import {IssueEntity} from '../../Library/Type/IssueEntity';
import {DateUtil} from '../../Library/Util/DateUtil';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import {StreamId} from '../StreamRepo';
import {color} from '../../Library/Style/color';
import {UserPrefRepo} from '../UserPrefRepo';

class _DBSetup {
  async exec(dbPath: string) {
    await DB.init(dbPath);
    await Promise.all([
      this.createIssues(),
      this.createStreams(),
      this.createStreamsIssues(),
      this.createSubscriptionIssues(),
      this.createFilterHistories(),
      this.createJumpNavigationHistories(),
    ]);
  }

  private async createIssues() {
    await DB.exec(`
    create table if not exists issues (
      _id integer primary key autoincrement,
      id integer unique not null,
      node_id string unique not null,
      type text not null,
      title text not null,
      created_at text not null,
      updated_at text not null,
      closed_at text,
      merged_at text,
      read_at text,
      prev_read_at text,
      unread_at text,
      archived_at text,
      marked_at text,
      number integer not null,
      user text not null,
      repo text not null,
      repo_private integer not null default 0,
      author text not null,
      assignees text,
      labels text,
      milestone text,
      due_on text,
      draft integer not null default 0,
      involves text,
      review_requested text,
      reviews text,
      project_urls text,
      project_names text,
      project_columns text,
      last_timeline_user text,
      last_timeline_at text,
      html_url text not null,
      body text,
      read_body text,
      prev_read_body text,
      value text not null
    )`);

    // migration to v0.2.1 from v0.2.0
    {
      const {error} = await DB.exec('select assignees from issues limit 1');
      if (error) {
        console.log('start migration: assignees');
        await DB.exec('alter table issues add column assignees text');
        const {rows: issues} = await DB.select<IssueEntity>('select * from issues');
        for (const issue of issues) {
          const value = JSON.parse(issue.value as any);
          let assignees = [];
          if (value.assignees) {
            assignees = value.assignees;
          } else if (value.assignee) {
            assignees = [value.assignee];
          }
          const names = assignees.length ? assignees.map((assignee)=> `<<<<${assignee.login}>>>>`).join('') : null; // hack

          await DB.exec('update issues set assignees = ? where id = ?', [names, issue.id]);
        }
        console.log('end migration: assignees');
      }
    }

    // migration to v0.3.0 from v0.2.5
    {
      const {error} = await DB.exec('select body from issues limit 1');
      if (error) {
        console.log('start migration: body');
        await DB.exec('alter table issues add column body text');
        const {rows: issues} = await DB.select<IssueEntity>('select * from issues');
        for (const issue of issues) {
          const value = JSON.parse(issue.value as any);
          await DB.exec('update issues set body = ? where id = ?', [value.body, issue.id]);
        }
        console.log('end migration: body');
      }
    }

    // migration to v0.4.0 from v0.3.1
    {
      const {error} = await DB.exec('select read_body from issues limit 1');
      if (error) {
        console.log('start migration: read_body');
        await DB.exec('alter table issues add column read_body text');
        await DB.exec('alter table issues add column prev_read_body text');
        await DB.exec('update issues set read_body = body, prev_read_body = body');
        console.log('end migration: read_body');
      }
    }

    // migration draft to v0.10.0
    {
      const {error} = await DB.exec('select draft from issues limit 1');
      if (error) {
        console.log('start migration: draft');
        await DB.exec('alter table issues add column draft integer not null default 0');
        console.log('end migration: draft');
      }
    }

    // migration merged_at to v0.10.0
    {
      const {error} = await DB.exec('select merged_at from issues limit 1');
      if (error) {
        console.log('start migration: merged_at');
        await DB.exec('alter table issues add column merged_at text');
        console.log('end migration: merged_at');
      }
    }

    // migration node_id to v0.10.0
    {
      const {error} = await DB.exec('select node_id from issues limit 1');
      if (error) {
        const now = Date.now();
        console.log('start migration: node_id');
        await DB.exec('alter table issues add column node_id text');
        const {error, rows} = await DB.select<{id: number; value: string}>('select id, value from issues');
        if (error) throw error;

        const whenRows: string[] = [];
        for (const row of rows) {
          const value = JSON.parse(row.value) as {node_id: string};
          if (value.node_id) whenRows.push(`when ${row.id} then "${value.node_id}"`);
        }
        const res = await DB.exec(`update issues set node_id = case id ${whenRows.join('\n')} end`);
        if (res.error) throw res.error;
        console.log(`end migration: node_id (${Date.now() - now}ms)`);
      }
    }

    // migration repo_private, involves, review_requested, reviews to v0.10.0
    {
      const {error} = await DB.exec('select repo_private, involves, review_requested, reviews from issues limit 1');
      if (error) {
        console.log('start migration: repo_private, involves, review_requested, reviews');
        await DB.exec('alter table issues add column repo_private integer');
        await DB.exec('alter table issues add column involves text');
        await DB.exec('alter table issues add column review_requested text');
        await DB.exec('alter table issues add column reviews text');
        console.log('end migration: repo_private, involves, review_requested, reviews');
      }
    }

    // migration last_timeline_user, last_timeline_at to v0.10.0
    {
      const {error} = await DB.exec('select last_timeline_user, last_timeline_at from issues limit 1');
      if (error) {
        console.log('start migration: last_timeline_user, last_timeline_at');
        await DB.exec('alter table issues add column last_timeline_user text');
        await DB.exec('alter table issues add column last_timeline_at text');
        console.log('end migration: last_timeline_user, last_timeline_at');
      }
    }

    // migration project_urls, project_names, project_columns to v0.10.0
    {
      const {error} = await DB.exec('select project_urls, project_names, project_columns from issues limit 1');
      if (error) {
        console.log('start migration: project_urls, project_names, project_columns');
        await DB.exec('alter table issues add column project_urls text');
        await DB.exec('alter table issues add column project_names text');
        await DB.exec('alter table issues add column project_columns text');
        console.log('end migration: project_urls, project_names, project_columns');
      }
    }

    // migration unread_at to v0.10.0
    {
      const {error} = await DB.exec('select unread_at from issues limit 1');
      if (error) {
        console.log('start migration: unread_at');
        await DB.exec('alter table issues add column unread_at text');
        console.log('end migration: unread_at');
      }
    }

    await DB.exec(`create index if not exists node_id_index on issues(node_id)`);
    await DB.exec(`create index if not exists type_index on issues(type)`);
    await DB.exec(`create index if not exists title_index on issues(title)`);
    await DB.exec(`create index if not exists read_at_index on issues(read_at)`);
    await DB.exec(`create index if not exists archived_at_index on issues(archived_at)`);
    await DB.exec(`create index if not exists marked_at_index on issues(marked_at)`);
    await DB.exec(`create index if not exists closed_at_index on issues(closed_at)`);
    await DB.exec(`create index if not exists created_at_index on issues(created_at)`);
    await DB.exec(`create index if not exists updated_at_index on issues(updated_at)`);
    await DB.exec(`create index if not exists number_index on issues(number)`);
    await DB.exec(`create index if not exists author_index on issues(author)`);
    await DB.exec(`create index if not exists assignees_index on issues(assignees)`);
    await DB.exec(`create index if not exists involves_index on issues(involves)`);
    await DB.exec(`create index if not exists review_requested_index on issues(review_requested)`);
    await DB.exec(`create index if not exists reviews_index on issues(reviews)`);
    await DB.exec(`create index if not exists milestone_index on issues(milestone)`);
    await DB.exec(`create index if not exists user_index on issues(user)`);
    await DB.exec(`create index if not exists repo_index on issues(repo)`);
    await DB.exec(`create index if not exists repo_private_index on issues(repo_private)`);
    await DB.exec(`create index if not exists html_url_index on issues(html_url)`);
    await DB.exec(`create index if not exists archived_updated_index on issues(archived_at,updated_at)`);
    await DB.exec(`create index if not exists archived_created_index on issues(archived_at,created_at)`);
    await DB.exec(`create index if not exists archived_closed_index on issues(archived_at,closed_at)`);
    await DB.exec(`create index if not exists archived_read_index on issues(archived_at,read_at)`);
    await DB.exec(`create index if not exists archived_due_index on issues(archived_at,due_on)`);
    await DB.exec(`create index if not exists draft_index on issues(draft)`);
    await DB.exec(`create index if not exists last_timeline_user_index on issues(last_timeline_user)`);
    await DB.exec(`create index if not exists last_timeline_at_index on issues(last_timeline_at)`);
    await DB.exec(`create index if not exists project_urls_index on issues(project_urls)`);
    await DB.exec(`create index if not exists project_names_index on issues(project_names)`);
    await DB.exec(`create index if not exists project_columns_index on issues(project_columns)`);
  }

  private async createStreams() {
    await DB.exec(`
    create table if not exists streams (
      id integer primary key autoincrement,
      type text,
      name text not null,
      query_stream_id integer default null,
      queries text not null,
      default_filter text,
      user_filter text,
      position integer,
      notification integer,
      icon text,
      color text,
      enabled integer not null default 1,
      created_at text,
      updated_at text,
      searched_at text
    )`);

    // migration column to v0.10.0
    {
      const {error} = await DB.exec('select type from streams limit 1');
      if (error) {
        console.log('start migration: streams.type and etc');
        await DB.exec('alter table streams add column type text');
        await DB.exec('alter table streams add column query_stream_id integer default null');
        await DB.exec('alter table streams add column default_filter text');
        await DB.exec('alter table streams add column user_filter text');
        await DB.exec('alter table streams add column icon text');
        await DB.exec('alter table streams add column enabled integer not null default 1');
        console.log('end migration: streams.type');
      }
    }

    // migration stream.{type, query_stream_id, default_filter, icon} to v0.10.0
    {
      const type: StreamEntity['type'] = 'UserStream';
      await DB.exec(`
        update
          streams
        set
          type = "${type}",
          query_stream_id = id,
          default_filter = "is:unarchived",
          user_filter = "",
          enabled = 1,
          icon = "github"
        where
          id > 0
          and type is null
      `);
    }

    // migration filtered_streams to v0.10.0
    {
      const {error, rows} = await DB.select<{stream_id: number; name: string; position: number; notification: number; filter: string; color: string; created_at: string; updated_at: string}>('select * from filtered_streams');
      if (!error) {
        console.log('start migration: filtered_streams');
        const type: StreamEntity['type'] = 'FilterStream';
        for (const row of rows) {
          const res = await DB.exec(`
          insert into
            streams (type, name, query_stream_id, queries, default_filter, user_filter, position, notification, icon, color, enabled, created_at, updated_at, searched_at)
          values
            ("${type}", "${row.name}", ${row.stream_id}, "", "is:unarchived", "${row.filter}", ${row.position}, ${row.notification}, "file-tree", "${row.color}", 1, "${row.created_at}", "${row.updated_at}", "")
          `);
          if (res.error) throw res.error;
        }
        await DB.exec('alter table filtered_streams rename to deleted_filtered_streams');
        console.log('start migration: filtered_streams');
      }
    }

    // migration system_streams and library stream to v0.10.0
    {
      const {error} = await DB.selectSingle(`select * from system_streams`);
      if (!error) {
        console.log('start migration: system_streams, library streams');
        const {row} = await DB.selectSingle<{maxId: number}>('select max(id) as maxId from streams');
        const meId = row.maxId + 1;
        const meQueries = JSON.stringify([`involves:${UserPrefRepo.getUser().login}`, `user:${UserPrefRepo.getUser().login}`]);

        const {rows} = await DB.select<{name: string, searched_at: string; enabled: number; notification: number}>('select * from system_streams');
        const me = rows.find(row => row.name === 'Me');
        const team = rows.find(row => row.name === 'Team');
        const watch = rows.find(row => row.name === 'Watching');
        const sub = rows.find(row => row.name === 'Subscription');

        const createdAt = DateUtil.localToUTCString(new Date());
        const uType: StreamEntity['type'] = 'UserStream';
        const sType: StreamEntity['type'] = 'SystemStream';
        const lType: StreamEntity['type'] = 'LibraryStream';
        let res = await DB.exec(`
        insert into
          streams (id, type, name, query_stream_id, queries, default_filter, user_filter, position, notification, icon, color, enabled, created_at, updated_at, searched_at)
        values
          (${StreamId.inbox},    "${lType}", "Inbox",    null, "", "is:unarchived",             "", -1004, 0, "inbox-full",        "${color.stream.blue}", 1, "${createdAt}", "${createdAt}", ""),
          (${StreamId.unread},   "${lType}", "Unread",   null, "", "is:unarchived is:unread",   "", -1003, 0, "clipboard-outline", "${color.stream.blue}", 0, "${createdAt}", "${createdAt}", ""),
          (${StreamId.open},     "${lType}", "Open",     null, "", "is:unarchived is:open",     "", -1002, 0, "book-open-variant", "${color.stream.blue}", 0, "${createdAt}", "${createdAt}", ""),
          (${StreamId.mark},     "${lType}", "Bookmark", null, "", "is:unarchived is:bookmark", "", -1001, 0, "bookmark",          "${color.stream.blue}", 1, "${createdAt}", "${createdAt}", ""),
          (${StreamId.archived}, "${lType}", "Archived", null, "", "is:archived",               "", -1000, 0, "archive",           "${color.stream.blue}", 1, "${createdAt}", "${createdAt}", ""),
          (${meId},                  "${uType}", "Me",           ${meId},      '${meQueries}', "is:unarchived", "", -103, ${me.notification},   "github",           "${color.brand}", ${me.enabled},     "${createdAt}", "${createdAt}", "${me.searched_at}"),
          (${StreamId.team},         "${sType}", "Team",         ${StreamId.team},         "", "is:unarchived", "", -102, ${team.notification},  "account-multiple", "${color.brand}", ${team.enabled},  "${createdAt}", "${createdAt}", "${team.searched_at}"),
          (${StreamId.watching},     "${sType}", "Watching",     ${StreamId.watching},     "", "is:unarchived", "", -101, ${watch.notification}, "eye",              "${color.brand}", ${watch.enabled}, "${createdAt}", "${createdAt}", "${watch.searched_at}"),
          (${StreamId.subscription}, "${sType}", "Subscription", ${StreamId.subscription}, "", "is:unarchived", "", -100, ${sub.notification},   "volume-high",      "${color.brand}", ${sub.enabled},   "${createdAt}", "${createdAt}", "${sub.searched_at}")
        `);
        if (res.error) throw res.error;

        res = await DB.exec(`update streams_issues set stream_id = ? where stream_id = ?`, [meId, StreamId.me]);
        if (res.error) throw res.error;

        await DB.exec(`alter table system_streams rename to deleted_system_streams`);
        console.log('end migration: system_streams, library streams');
      }
    }
  }

  private async createSubscriptionIssues() {
    await DB.exec(`
    create table if not exists subscription_issues (
      id integer primary key,
      issue_id integer not null,
      url text not null,
      repo text not null,
      created_at text not null
    )`);
    await DB.exec(`create index if not exists url_index on subscription_issues(url)`);
  }

  private async createStreamsIssues() {
    await DB.exec(`
    create table if not exists streams_issues (
      id integer primary key autoincrement,
      stream_id integer not null,
      issue_id integer not null
    )`);
    await DB.exec(`create index if not exists stream_issue_index on streams_issues(stream_id, issue_id)`);
  }

  private async createFilterHistories() {
    await DB.exec(`
    create table if not exists filter_histories (
      id integer primary key autoincrement,
      filter text not null,
      created_at text not null
    )`);
    await DB.exec(`create index if not exists filter_index on filter_histories(filter)`);
    await DB.exec(`create index if not exists created_at_index on filter_histories(created_at)`);
  }

  private async createJumpNavigationHistories() {
    await DB.exec(`
    create table if not exists jump_navigation_histories (
      id integer primary key autoincrement,
      keyword text not null,
      created_at text not null
    )`);
    await DB.exec(`create index if not exists keyword_index on jump_navigation_histories(keyword)`);
    await DB.exec(`create index if not exists created_at_index on jump_navigation_histories(created_at)`);
  }
}

export const DBSetup = new _DBSetup();
