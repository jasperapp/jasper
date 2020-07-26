// import {RemoteDB as DB} from './Remote';

import {DBIPC} from '../IPC/DBIPC';

class _LibraryStreamCenter {
  async findAllStreams() {
    const promises = [];
    promises.push(this.findInboxStream());
    promises.push(this.findUnreadStream());
    promises.push(this.findOpenStream());
    promises.push(this.findMarkedStream());
    promises.push(this.findArchivedStream());

    return await Promise.all(promises);
  }

  async findInboxStream() {
    const {row} = await DBIPC.selectSingle(`
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
    return {name: 'Inbox', unreadCount: row.count};
  }

  async findUnreadStream() {
    const {row} = await DBIPC.selectSingle(`
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
    return {name: 'Unread', unreadCount: row.count};
  }

  async findMarkedStream() {
    const {row} = await DBIPC.selectSingle(`
      select
        count(distinct t1.id) as count
      from
        issues as t1
      inner join
        streams_issues as t2 on t1.id = t2.issue_id
      where
        marked_at is not null
        and ((read_at is null) or (updated_at > read_at))
        and archived_at is null
    `);
    return {name: 'Marked', unreadCount: row.count};
  }

  async findOpenStream() {
    const {row} = await DBIPC.selectSingle(`
      select
        count(distinct t1.id) as count
      from
        issues as t1
      inner join
        streams_issues as t2 on t1.id = t2.issue_id
      where
        closed_at is null
        and ((read_at is null) or (updated_at > read_at))
        and archived_at is null
    `);
    return {name: 'Open', unreadCount: row.count};
  }

  async findArchivedStream() {
    const {row} = await DBIPC.selectSingle(`
      select
        count(distinct t1.id) as count
      from
        issues as t1
      inner join
        streams_issues as t2 on t1.id = t2.issue_id
      where
        archived_at is not null
        and ((read_at is null) or (updated_at > read_at))
    `);
    return {name: 'Archived', unreadCount: row.count};
  }
}

export const LibraryStreamCenter = new _LibraryStreamCenter();
