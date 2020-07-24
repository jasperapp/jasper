import {DBIPC} from '../../IPC/DBIPC';

type StreamRow = {
  id: number;
  name: number;
  queries: string;
  searched_at: string;
}

class _StreamsRepo {
  async all(): Promise<{error?: Error; rows?: StreamRow[]}> {
    return await DBIPC.select('select * from streams order by id');
  }

  async find(streamId): Promise<{error?: Error; row?: StreamRow}> {
    return await DBIPC.selectSingle('select * from streams where id = ?', [streamId]);
  }

  async updateSearchedAt(streamId: number, utcString: string): Promise<void> {
    await DBIPC.exec(`update streams set searched_at = ? where id = ?`, [utcString, streamId]);
  }
}

export const StreamsRepo = new _StreamsRepo();
