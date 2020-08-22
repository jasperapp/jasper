import {LibraryStreamEntity} from '../Library/Type/StreamEntity';
import {IssueRepo} from './IssueRepo';

export enum LibraryStreamId {
  inbox = -1000,
  unread = -1001,
  open = -1002,
  mark = -1003,
  archived = -1004,
}

const LibraryStreamEntities: LibraryStreamEntity[] = [
  {type: 'libraryStream', id: LibraryStreamId.inbox, name: 'Inbox',     defaultFilter: 'is:unarchived', iconName: 'inbox-full', unreadCount: 0, enabled: 1},
  {type: 'libraryStream', id: LibraryStreamId.unread, name: 'Unread',    defaultFilter: 'is:unarchived is:unread', iconName: 'clipboard-outline', unreadCount: 0, enabled: 1},
  {type: 'libraryStream', id: LibraryStreamId.open, name: 'Open',      defaultFilter: 'is:unarchived is:open', iconName: 'book-open-variant', unreadCount: 0, enabled: 1},
  {type: 'libraryStream', id: LibraryStreamId.mark, name: 'Bookmark',      defaultFilter: 'is:unarchived is:star', iconName: 'bookmark', unreadCount: 0, enabled: 1},
  {type: 'libraryStream', id: LibraryStreamId.archived, name: 'Archived',  defaultFilter: 'is:archived', iconName: 'archive', unreadCount: 0, enabled: 1},
]

class _LibraryStreamRepo {
  private async relations(libraryStreams: LibraryStreamEntity[]) {
    if (!libraryStreams.length) return;
    await this.relationUnreadCount(libraryStreams);
  }

  private async relationUnreadCount(libraryStreams: LibraryStreamEntity[]) {
    const promises = libraryStreams.map(s => IssueRepo.getUnreadCountInStream(null, s.defaultFilter, ''));
    const results = await Promise.all(promises);
    const error = results.find(res => res.error)?.error;
    if (error) return console.error(error);

    libraryStreams.forEach((libraryStream, index) => {
      libraryStream.unreadCount = results[index].count;
    });
  }

  async getAllLibraryStreams(): Promise<{error?: Error; libraryStreams?: LibraryStreamEntity[]}> {
    const libraryStreams: LibraryStreamEntity[] = LibraryStreamEntities.map(v => ({...v}));
    await this.relations(libraryStreams);

    return {libraryStreams};
  }

  async getLibraryStream(name: string): Promise<{error?: Error; libraryStream?: LibraryStreamEntity}> {
    const libraryStreamEntity = LibraryStreamEntities.find(v => v.name === name);
    if (!libraryStreamEntity) return {error: new Error(`not found library stream. name = ${name}`)};

    const libraryStream: LibraryStreamEntity = {...libraryStreamEntity};
    await this.relations([libraryStream]);
    return {libraryStream};
  }
}

export const LibraryStreamRepo = new _LibraryStreamRepo();
