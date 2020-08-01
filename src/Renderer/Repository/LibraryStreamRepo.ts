import {DBIPC} from '../../IPC/DBIPC';
import {LibraryStreamEntity} from '../Type/LibraryStreamEntity';

class _LibraryStreamRepo {
  async getAllLibraryStreams(): Promise<{error?: Error; libraryStreams?: LibraryStreamEntity[]}> {
    const promises = [
      this.getLibraryStream('Inbox', false, false, false),
      this.getLibraryStream('Unread', false, false, false),
      this.getLibraryStream('Open', false, true, false),
      this.getLibraryStream('Marked', true, false, false),
      this.getLibraryStream('Archived', false, false, true),
    ];

    const results = await Promise.all(promises);
    const error = results.find(res => res.error)?.error;
    if (error) return {error};

    const libraryStreams = results.map(res => res.libraryStream);
    return {libraryStreams};
  }

  private async getLibraryStream(name: string, isMarked: boolean, isOpen: boolean, isArchived: boolean): Promise<{error?: Error; libraryStream?: LibraryStreamEntity}> {
    const conds = ['((read_at is null) or (updated_at > read_at))'];
    if (isMarked) conds.push('marked_at is not null');
    if (isOpen) conds.push('closed_at is null');
    if (isArchived) {
      conds.push('archived_at is not null')
    } else {
      conds.push('archived_at is null')
    }

    const sql = `
      select
        "${name}" as name
        , count(distinct t1.id) as unreadCount
      from
        issues as t1
      inner join
        streams_issues as t2 on t1.id = t2.issue_id
      where
        ${conds.join(' and ')}
    `;

    const {error, row} = await DBIPC.selectSingle<LibraryStreamEntity>(sql);
    if (error) return {error};

    return {libraryStream: row};
  }

  // async findAllStreams() {
  //   const promises = [];
  //   promises.push(this.findInboxStream());
  //   promises.push(this.findUnreadStream());
  //   promises.push(this.findOpenStream());
  //   promises.push(this.findMarkedStream());
  //   promises.push(this.findArchivedStream());
  //
  //   return await Promise.all(promises);
  // }

  // async findInboxStream() {
  //   const {row} = await DBIPC.selectSingle(`
  //     select
  //       count(distinct t1.id) as count
  //     from
  //       issues as t1
  //     inner join
  //       streams_issues as t2 on t1.id = t2.issue_id
  //     where
  //       ((read_at is null) or (updated_at > read_at))
  //       and archived_at is null
  //   `);
  //   return {name: 'Inbox', unreadCount: row.count};
  // }
  //
  // async findUnreadStream() {
  //   const {row} = await DBIPC.selectSingle(`
  //     select
  //       count(distinct t1.id) as count
  //     from
  //       issues as t1
  //     inner join
  //       streams_issues as t2 on t1.id = t2.issue_id
  //     where
  //       ((read_at is null) or (updated_at > read_at))
  //       and archived_at is null
  //   `);
  //   return {name: 'Unread', unreadCount: row.count};
  // }
  //
  // async findMarkedStream() {
  //   const {row} = await DBIPC.selectSingle(`
  //     select
  //       count(distinct t1.id) as count
  //     from
  //       issues as t1
  //     inner join
  //       streams_issues as t2 on t1.id = t2.issue_id
  //     where
  //       marked_at is not null
  //       and ((read_at is null) or (updated_at > read_at))
  //       and archived_at is null
  //   `);
  //   return {name: 'Marked', unreadCount: row.count};
  // }
  //
  // async findOpenStream() {
  //   const {row} = await DBIPC.selectSingle(`
  //     select
  //       count(distinct t1.id) as count
  //     from
  //       issues as t1
  //     inner join
  //       streams_issues as t2 on t1.id = t2.issue_id
  //     where
  //       closed_at is null
  //       and ((read_at is null) or (updated_at > read_at))
  //       and archived_at is null
  //   `);
  //   return {name: 'Open', unreadCount: row.count};
  // }
  //
  // async findArchivedStream() {
  //   const {row} = await DBIPC.selectSingle(`
  //     select
  //       count(distinct t1.id) as count
  //     from
  //       issues as t1
  //     inner join
  //       streams_issues as t2 on t1.id = t2.issue_id
  //     where
  //       archived_at is not null
  //       and ((read_at is null) or (updated_at > read_at))
  //   `);
  //   return {name: 'Archived', unreadCount: row.count};
  // }
}

export const LibraryStreamRepo = new _LibraryStreamRepo();
