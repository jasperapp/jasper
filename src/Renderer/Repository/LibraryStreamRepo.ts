import {IssueRepo} from './IssueRepo';
import {StreamEntity} from '../Library/Type/StreamEntity';

class _LibraryStreamRepo {
  private async relations(libraryStreams: StreamEntity[]) {
    if (!libraryStreams.length) return;
    await this.relationUnreadCount(libraryStreams);
  }

  private async relationUnreadCount(libraryStreams: StreamEntity[]) {
    const promises = libraryStreams.map(s => IssueRepo.getUnreadCountInStream(null, s.defaultFilter, ''));
    const results = await Promise.all(promises);
    const error = results.find(res => res.error)?.error;
    if (error) return console.error(error);

    libraryStreams.forEach((libraryStream, index) => {
      libraryStream.unreadCount = results[index].count;
    });
  }

  async getAllLibraryStreams(): Promise<{error?: Error; libraryStreams?: StreamEntity[]}> {
    const libraryStreams: StreamEntity[] = LibraryStreamEntities.map(v => ({...v}));
    await this.relations(libraryStreams);

    return {libraryStreams};
  }
}

export const LibraryStreamRepo = new _LibraryStreamRepo();

export enum LibraryStreamId {
  inbox = -1000,
  unread = -1001,
  open = -1002,
  mark = -1003,
  archived = -1004,
}

const LibraryStreamEntities: StreamEntity[] = [
  {
    id: LibraryStreamId.inbox,
    name: 'Inbox',
    queryStreamId: null,
    filter: '',
    defaultFilter: 'is:unarchived',
    iconName: 'inbox-full',
    unreadCount: 0,
    enabled: 1,
    position: 0,
    queries: '',
    searched_at: '',
    notification: 0,
    color: '',
  },
  {
    id: LibraryStreamId.unread,
    name: 'Unread',
    queryStreamId: null,
    filter: '',
    defaultFilter: 'is:unarchived is:unread',
    iconName: 'clipboard-outline',
    unreadCount: 0,
    enabled: 1,
    position: 1,
    queries: '',
    searched_at: '',
    notification: 0,
    color: '',
  },
  {
    id: LibraryStreamId.open,
    name: 'Open',
    queryStreamId: null,
    filter: '',
    defaultFilter: 'is:unarchived is:open',
    iconName: 'book-open-variant',
    unreadCount: 0,
    enabled: 1,
    position: 2,
    queries: '',
    searched_at: '',
    notification: 0,
    color: '',
  },
  {
    id: LibraryStreamId.mark,
    name: 'Bookmark',
    queryStreamId: null,
    filter: '',
    defaultFilter: 'is:unarchived is:star',
    iconName: 'bookmark',
    unreadCount: 0,
    enabled: 1,
    position: 3,
    queries: '',
    searched_at: '',
    notification: 0,
    color: '',
  },
  {
    id: LibraryStreamId.archived,
    name: 'Archived',
    queryStreamId: null,
    filter: '',
    defaultFilter: 'is:archived',
    iconName: 'archive',
    unreadCount: 0,
    enabled: 1,
    position: 4,
    queries: '',
    searched_at: '',
    notification: 0,
    color: '',
  },
];

