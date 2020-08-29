import {DB} from '../../Library/Infra/DB';
import {IssueEntity} from '../../Library/Type/IssueEntity';
import {DateUtil} from '../../Library/Util/DateUtil';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import {StreamId} from '../StreamRepo';

class _DBSetup {
  async exec(dbPath: string) {
    await DB.init(dbPath);
    await this.createIssues();
    await this.createStreams();
    await this.createStreamsIssues()
    await this.createSubscriptionIssues();
    await this.createFilterHistories();
  }

  private async createIssues() {
    await DB.exec(`
    create table if not exists issues (
      _id integer primary key autoincrement,
      id integer unique not null,
      type text not null,
      title text not null,
      created_at text not null,
      updated_at text not null,
      closed_at text,
      merged_at text,
      read_at text,
      prev_read_at text,
      archived_at text,
      marked_at text,
      number integer not null,
      user text not null,
      repo text not null,
      author text not null,
      assignees text,
      labels text,
      milestone text,
      due_on text,
      draft integer not null default 0,
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
    await DB.exec(`create index if not exists milestone_index on issues(milestone)`);
    await DB.exec(`create index if not exists user_index on issues(user)`);
    await DB.exec(`create index if not exists repo_index on issues(repo)`);
    await DB.exec(`create index if not exists html_url_index on issues(html_url)`);
    await DB.exec(`create index if not exists archived_updated_index on issues(archived_at,updated_at)`);
    await DB.exec(`create index if not exists archived_created_index on issues(archived_at,created_at)`);
    await DB.exec(`create index if not exists archived_closed_index on issues(archived_at,closed_at)`);
    await DB.exec(`create index if not exists archived_read_index on issues(archived_at,read_at)`);
    await DB.exec(`create index if not exists archived_due_index on issues(archived_at,due_on)`);
    await DB.exec(`create index if not exists draft_index on issues(draft)`);
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
          await DB.exec(`
          insert into
            streams (type, name, query_stream_id, queries, default_filter, user_filter, position, notification, icon, color, enabled, created_at, updated_at, searched_at)
          values
            ("${type}", "${row.name}", ${row.stream_id}, "", "is:unarchived", "${row.filter}", ${row.position}, ${row.notification}, "file-tree", "${row.color}", 1, "${row.created_at}", "${row.updated_at}", "")
          `);
        }
        await DB.exec('drop table filtered_streams');
        console.log('start migration: filtered_streams');
      }
    }

    // insert system
    {
      const {row} = await DB.selectSingle<{count: number}>(`select count(1) as count from streams where id between ${StreamId.subscription} and ${StreamId.me}`);
      if (row.count === 0) {
        const {rows} = await DB.select<{name: string, searched_at: string}>('select * from system_streams');
        const searchedAtMe = rows?.find(row => row.name === 'Me')?.searched_at || '';
        const searchedAtTeam = rows?.find(row => row.name === 'Team')?.searched_at || '';
        const searchedAtWatching = rows?.find(row => row.name === 'Watching')?.searched_at || '';
        const searchedAtSubscription = rows?.find(row => row.name === 'Subscription')?.searched_at || '';

        const createdAt = DateUtil.localToUTCString(new Date());
        const type: StreamEntity['type'] = 'SystemStream';
        await DB.exec(`
        insert into
          streams (id, type, name, query_stream_id, queries, default_filter, user_filter, position, notification, icon, enabled, created_at, updated_at, searched_at)
        values
          (${StreamId.me},           "${type}", "Me",           ${StreamId.me},           "", "is:unarchived", "", 0, 1, "account",          1, "${createdAt}", "${createdAt}", "${searchedAtMe}"),
          (${StreamId.team},         "${type}", "Team",         ${StreamId.team},         "", "is:unarchived", "", 1, 1, "account-multiple", 1, "${createdAt}", "${createdAt}", "${searchedAtTeam}"),
          (${StreamId.watching},     "${type}", "Watching",     ${StreamId.watching},     "", "is:unarchived", "", 2, 1, "eye",              1, "${createdAt}", "${createdAt}", "${searchedAtWatching}"),
          (${StreamId.subscription}, "${type}", "Subscription", ${StreamId.subscription}, "", "is:unarchived", "", 3, 1, "volume-high",      1, "${createdAt}", "${createdAt}", "${searchedAtSubscription}")
        `);
        await DB.exec(`drop table system_streams`);
      }
    }

    // insert library
    {
      const {row} = await DB.selectSingle<{count: number}>(`select count(1) as count from streams where id between ${StreamId.archived} and ${StreamId.inbox}`);
      if (row.count === 0) {
        const createdAt = DateUtil.localToUTCString(new Date());
        const type: StreamEntity['type'] = 'LibraryStream';
        await DB.exec(`
        insert into
          streams (id, type, name, query_stream_id, queries, default_filter, user_filter, position, notification, icon, enabled, created_at, updated_at, searched_at)
        values
          (${StreamId.inbox},    "${type}", "Inbox",    null, "", "is:unarchived",             "", 0, 0, "inbox-full",        1, "${createdAt}", "${createdAt}", ""),
          (${StreamId.unread},   "${type}", "Unread",   null, "", "is:unarchived is:unread",   "", 1, 0, "clipboard-outline", 1, "${createdAt}", "${createdAt}", ""),
          (${StreamId.open},     "${type}", "Open",     null, "", "is:unarchived is:open",     "", 2, 0, "book-open-variant", 1, "${createdAt}", "${createdAt}", ""),
          (${StreamId.mark},     "${type}", "Bookmark", null, "", "is:unarchived is:bookmark", "", 3, 0, "bookmark",          1, "${createdAt}", "${createdAt}", ""),
          (${StreamId.archived}, "${type}", "Archived", null, "", "is:archived",               "", 4, 0, "archive",           1, "${createdAt}", "${createdAt}", "")
      `);
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
}

export const DBSetup = new _DBSetup();
