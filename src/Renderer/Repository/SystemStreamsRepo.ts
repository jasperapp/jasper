import {DBIPC} from '../../IPC/DBIPC';

type SystemStreamRow = {
  id: number;
  name: string;
  searched_at: string;
  enabled: boolean;
}

class _SystemStreamsRepo {
  async all(): Promise<{error?: Error; rows?: SystemStreamRow[]}> {
    return await DBIPC.select('select * from system_streams order by position');
  }

  async find(id: number): Promise<{error?: Error; row?: SystemStreamRow}> {
    return await DBIPC.selectSingle('select * from system_streams where id = ?', [id]);
  }

  async updateSearchedAt(streamId: number, utcString: string): Promise<void> {
    await DBIPC.exec(`update system_streams set searched_at = ? where id = ?`, [utcString, streamId]);
  }
}

export const SystemStreamsRepo = new _SystemStreamsRepo();
