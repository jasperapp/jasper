import {LibraryStreamEntity} from '../Type/StreamEntity';
import {IssueRepo} from './IssueRepo';

const LibraryStreamValues: {name: string; defaultFilter: string}[] = [
  {name: 'Inbox',     defaultFilter: 'is:unarchived'},
  {name: 'Unread',    defaultFilter: 'is:unarchived is:unread'},
  {name: 'Open',      defaultFilter: 'is:unarchived is:open'},
  {name: 'Marked',    defaultFilter: 'is:unarchived is:star'},
  {name: 'Archived',  defaultFilter: 'is:archived'},
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
    const libraryStreams: LibraryStreamEntity[] = LibraryStreamValues.map(v => {
      return {name: v.name, defaultFilter: v.defaultFilter, unreadCount: 0, id: null};
    });
    await this.relations(libraryStreams);

    return {libraryStreams};
  }

  async getLibraryStream(name: string): Promise<{error?: Error; libraryStream?: LibraryStreamEntity}> {
    const value = LibraryStreamValues.find(v => v.name === name);
    if (!value) return {error: new Error(`not found library stream. name = ${name}`)};

    const libraryStream: LibraryStreamEntity = {
      id: null,
      name: value.name,
      defaultFilter: value.defaultFilter,
      unreadCount: 0,
    };

    await this.relations([libraryStream]);
    return {libraryStream};
  }
}

export const LibraryStreamRepo = new _LibraryStreamRepo();
