import Logger from 'color-logger';
import fs from 'fs-extra';
import {Config} from './Config';
import {DB} from '../DB/DB';
import {GitHubClientDeliver} from '../GitHub/GitHubClientDeliver';
import {GitHubClient} from '../GitHub/GitHubClient';
import {SystemStreamLauncher} from '../Stream/SystemStreamLauncher';
import {StreamLauncher} from '../Stream/StreamLauncher';
import {StreamInitializer} from '../Initializer/StreamInitializer';
import {Global} from './Global';

class _Bootstrap {
  async start() {
    await this._startSelfName();
    await this._startDB();
    await StreamInitializer.init();
    await this._startStream();
    this._loadTheme();
  }

  async restart() {
    this._startClientDeliver();
    await this._startSelfName();
    await this._startStream();
    this._loadTheme();
  }

  async restartOnlyPolling() {
    this._startClientDeliver();
    await this._startStream();
  }

  stop() {
    SystemStreamLauncher.stopAll();
    StreamLauncher.stopAll();
  }

  _startClientDeliver() {
    GitHubClientDeliver.stop(); // auto restart
    GitHubClientDeliver.stopImmediate(); // auto restart
  }

  async _startSelfName() {
    const client = new GitHubClient(Config.accessToken, Config.host, Config.pathPrefix, Config.https);
    const response = await client.requestImmediate('/user');
    Config.loginName = response.body.login;
  }

  async _startStream() {
    await SystemStreamLauncher.restartAll();
    await StreamLauncher.restartAll();
  }

  async _startDB() {

    // issues
    await DB.exec(`
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
        await DB.exec('select assignees from issues limit 1');
      } catch(e) {
        Logger.d('start migration: assignees');
        await DB.exec('alter table issues add column assignees text');
        const issues = await DB.select('select * from issues');
        for (const issue of issues) {
          const value = JSON.parse(issue.value);
          let assignees = [];
          if (value.assignees) {
            assignees = value.assignees;
          } else if (value.assignee) {
            assignees = [value.assignee];
          }
          const names = assignees.length ? assignees.map((assignee)=> `<<<<${assignee.login}>>>>`).join('') : null; // hack

          await DB.exec('update issues set assignees = ? where id = ?', [names, issue.id]);
        }
        Logger.d('end migration: assignees');
      }
    }

    // migration to v0.3.0 from v0.2.5
    {
      try {
        await DB.exec('select body from issues limit 1');
      } catch(e) {
        Logger.d('start migration: body');
        await DB.exec('alter table issues add column body text');
        const issues = await DB.select('select * from issues');
        for (const issue of issues) {
          const value = JSON.parse(issue.value);
          await DB.exec('update issues set body = ? where id = ?', [value.body, issue.id]);
        }
        Logger.d('end migration: body');
      }
    }

    // migration to v0.4.0 from v0.3.1
    {
      try {
        await DB.exec('select read_body from issues limit 1');
      } catch(e) {
        Logger.d('start migration: read_body');
        await DB.exec('alter table issues add column read_body text');
        await DB.exec('alter table issues add column prev_read_body text');
        await DB.exec('update issues set read_body = body, prev_read_body = body');
        Logger.d('end migration: read_body');
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

    // streams
    await DB.exec(`
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

    // system streams
    await DB.exec(`
    create table if not exists system_streams (
      id integer primary key,
      name text not null,
      enabled integer not null,
      notification integer not null,
      color text,
      position integer,
      searched_at text
    )`);
    const temp = await DB.selectSingle(`select count(1) as count from system_streams`);
    if (temp.count === 0) {
      await DB.exec(`
        insert into
          system_streams (id, name, enabled, notification, position)
        values
          (-1, "Me", 1, 1, 0),
          (-2, "Team", 1, 1, 1),
          (-3, "Watching", 1, 1, 2),
          (-4, "Subscription", 1, 1, 3)
      `);
    }

    // subscription
    await DB.exec(`
    create table if not exists subscription_issues (
      id integer primary key,
      issue_id integer not null,
      url text not null,
      repo text not null,
      created_at text not null
    )`);
    await DB.exec(`create index if not exists url_index on subscription_issues(url)`);

    // streams_issues
    await DB.exec(`
    create table if not exists streams_issues (
      id integer primary key autoincrement,
      stream_id integer not null,
      issue_id integer not null
    )`);
    await DB.exec(`create index if not exists stream_issue_index on streams_issues(stream_id, issue_id)`);

    // filter_histories
    await DB.exec(`
    create table if not exists filter_histories (
      id integer primary key autoincrement,
      filter text not null,
      created_at text not null
    )`);
    await DB.exec(`create index if not exists filter_index on filter_histories(filter)`);
    await DB.exec(`create index if not exists created_at_index on filter_histories(created_at)`);

    // filtered stream
    await DB.exec(`
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
    await DB.exec(`create index if not exists stream_index on filtered_streams(stream_id)`);
    await DB.exec(`create index if not exists position_index on filtered_streams(position)`);

    // todo: remove migration for test users
    {
      try {
        await DB.exec('select color from streams limit 1');
      } catch(e) {
        await DB.exec('alter table streams add column color text');
        await DB.exec('alter table system_streams add column color text');
      }
    }
  }

  _loadTheme() {
    if (Config.themeMainPath)  {
      const css = fs.readFileSync(Config.themeMainPath).toString();
      Global.getMainWindow().webContents.send('load-theme-main', css);
    } else {
      Global.getMainWindow().webContents.send('load-theme-main', '');
    }
  }
}

export const Bootstrap = new _Bootstrap();
