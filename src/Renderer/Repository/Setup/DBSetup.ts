import {DBIPC} from '../../../IPC/DBIPC';

class _DBSetup {
  async exec(configIndex: number) {
    await DBIPC.init(configIndex);
    await this.createIssues();
    await this.createStreams();
    await this.createSystemStreams();
    await this.createSubscriptionIssues();
    await this.createStreamsIssues()
    await this.createFilterHistories()
    await this.createFilteredStreams();
  }

  private async createIssues() {
    await DBIPC.exec(`
    create table if not exists issues (
      _id integer primary key autoincrement,
      id integer unique not null,
      type text not null,
      title text not null,
      created_at text not null,
      updated_at text not null,
      closed_at text,
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
      html_url text not null,
      body text,
      read_body text,
      prev_read_body text,
      value text not null
    )`);

    // migration to v0.2.1 from v0.2.0
    {
      try {
        await DBIPC.exec('select assignees from issues limit 1');
      } catch(e) {
        console.log('start migration: assignees');
        await DBIPC.exec('alter table issues add column assignees text');
        const {rows: issues} = await DBIPC.select('select * from issues');
        for (const issue of issues) {
          const value = JSON.parse(issue.value);
          let assignees = [];
          if (value.assignees) {
            assignees = value.assignees;
          } else if (value.assignee) {
            assignees = [value.assignee];
          }
          const names = assignees.length ? assignees.map((assignee)=> `<<<<${assignee.login}>>>>`).join('') : null; // hack

          await DBIPC.exec('update issues set assignees = ? where id = ?', [names, issue.id]);
        }
        console.log('end migration: assignees');
      }
    }

    // migration to v0.3.0 from v0.2.5
    {
      try {
        await DBIPC.exec('select body from issues limit 1');
      } catch(e) {
        console.log('start migration: body');
        await DBIPC.exec('alter table issues add column body text');
        const {rows: issues} = await DBIPC.select('select * from issues');
        for (const issue of issues) {
          const value = JSON.parse(issue.value);
          await DBIPC.exec('update issues set body = ? where id = ?', [value.body, issue.id]);
        }
        console.log('end migration: body');
      }
    }

    // migration to v0.4.0 from v0.3.1
    {
      try {
        await DBIPC.exec('select read_body from issues limit 1');
      } catch(e) {
        console.log('start migration: read_body');
        await DBIPC.exec('alter table issues add column read_body text');
        await DBIPC.exec('alter table issues add column prev_read_body text');
        await DBIPC.exec('update issues set read_body = body, prev_read_body = body');
        console.log('end migration: read_body');
      }
    }

    await DBIPC.exec(`create index if not exists type_index on issues(type)`);
    await DBIPC.exec(`create index if not exists title_index on issues(title)`);
    await DBIPC.exec(`create index if not exists read_at_index on issues(read_at)`);
    await DBIPC.exec(`create index if not exists archived_at_index on issues(archived_at)`);
    await DBIPC.exec(`create index if not exists marked_at_index on issues(marked_at)`);
    await DBIPC.exec(`create index if not exists closed_at_index on issues(closed_at)`);
    await DBIPC.exec(`create index if not exists created_at_index on issues(created_at)`);
    await DBIPC.exec(`create index if not exists updated_at_index on issues(updated_at)`);
    await DBIPC.exec(`create index if not exists number_index on issues(number)`);
    await DBIPC.exec(`create index if not exists author_index on issues(author)`);
    await DBIPC.exec(`create index if not exists assignees_index on issues(assignees)`);
    await DBIPC.exec(`create index if not exists milestone_index on issues(milestone)`);
    await DBIPC.exec(`create index if not exists user_index on issues(user)`);
    await DBIPC.exec(`create index if not exists repo_index on issues(repo)`);
    await DBIPC.exec(`create index if not exists html_url_index on issues(html_url)`);
    await DBIPC.exec(`create index if not exists archived_updated_index on issues(archived_at,updated_at)`);
    await DBIPC.exec(`create index if not exists archived_created_index on issues(archived_at,created_at)`);
    await DBIPC.exec(`create index if not exists archived_closed_index on issues(archived_at,closed_at)`);
    await DBIPC.exec(`create index if not exists archived_read_index on issues(archived_at,read_at)`);
    await DBIPC.exec(`create index if not exists archived_due_index on issues(archived_at,due_on)`);
  }

  private async createStreams() {
    // streams
    await DBIPC.exec(`
    create table if not exists streams (
      id integer primary key autoincrement,
      name text not null,
      queries text not null,
      position integer,
      notification integer,
      color text,
      created_at text,
      updated_at text,
      searched_at text
    )`);
  }

  private async createSystemStreams() {
    await DBIPC.exec(`
    create table if not exists system_streams (
      id integer primary key,
      name text not null,
      enabled integer not null,
      notification integer not null,
      color text,
      position integer,
      searched_at text
    )`);

    const {row} = await DBIPC.selectSingle(`select count(1) as count from system_streams`);
    if (row.count === 0) {
      await DBIPC.exec(`
        insert into
          system_streams (id, name, enabled, notification, position)
        values
          (-1, "Me", 1, 1, 0),
          (-2, "Team", 1, 1, 1),
          (-3, "Watching", 1, 1, 2),
          (-4, "Subscription", 1, 1, 3)
      `);
    }
  }

  private async createSubscriptionIssues() {
    await DBIPC.exec(`
    create table if not exists subscription_issues (
      id integer primary key,
      issue_id integer not null,
      url text not null,
      repo text not null,
      created_at text not null
    )`);
    await DBIPC.exec(`create index if not exists url_index on subscription_issues(url)`);
  }

  private async createStreamsIssues() {
    await DBIPC.exec(`
    create table if not exists streams_issues (
      id integer primary key autoincrement,
      stream_id integer not null,
      issue_id integer not null
    )`);
    await DBIPC.exec(`create index if not exists stream_issue_index on streams_issues(stream_id, issue_id)`);
  }

  private async createFilterHistories() {
    await DBIPC.exec(`
    create table if not exists filter_histories (
      id integer primary key autoincrement,
      filter text not null,
      created_at text not null
    )`);
    await DBIPC.exec(`create index if not exists filter_index on filter_histories(filter)`);
    await DBIPC.exec(`create index if not exists created_at_index on filter_histories(created_at)`);
  }

  private async createFilteredStreams() {
    await DBIPC.exec(`
    create table if not exists filtered_streams (
      id integer primary key autoincrement,
      stream_id integer,
      name text not null,
      filter text not null,
      notification integer not null,
      color text,
      position integer,
      created_at text not null,
      updated_at text not null
    )`);
    await DBIPC.exec(`create index if not exists stream_index on filtered_streams(stream_id)`);
    await DBIPC.exec(`create index if not exists position_index on filtered_streams(position)`);
  }
}

export const DBSetup = new _DBSetup();
