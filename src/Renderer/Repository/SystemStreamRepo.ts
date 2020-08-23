import {StreamEntity} from '../Library/Type/StreamEntity';
import {IssueRepo} from './IssueRepo';
import {DB} from '../Library/Infra/DB';
import {IconNameType} from '../Library/Type/IconNameType';

export enum SystemStreamId {
  me = -1,
  team = -2,
  watching = -3,
  subscription = -4,
}

type SystemStreamRow = {
  id: SystemStreamId;
  name: string;
  enabled: number;
  notification: number;
  color: string;
  position: number;
  searched_at: string;
}

class _SystemStreamRepo {
  private async convert(systemStreamRows: SystemStreamRow[]): Promise<StreamEntity[]> {
    if (!systemStreamRows.length) return;

    const systemStreams: StreamEntity[] = systemStreamRows.map(row => {
      return {
        ...row,
        queryStreamId: row.id,
        queries: '__dynamic__',
        defaultFilter: 'is:unarchived',
        filter: '',
        iconName: this.getIconName(row.id),
        unreadCount: 0,
      };
    });

    await this.relationUnreadCount(systemStreams);

    return systemStreams;
  }

  private async relationUnreadCount(systemStreams: StreamEntity[]) {
    const promises = systemStreams.map(s => IssueRepo.getUnreadCountInStream(s.id, s.defaultFilter));
    const results = await Promise.all(promises);
    const error = results.find(res => res.error)?.error;
    if (error) return;

    systemStreams.forEach((s, index) => s.unreadCount = results[index].count);
  }

  private getIconName(streamId: number): IconNameType {
    switch (streamId) {
      case SystemStreamId.me: return 'account';
      case SystemStreamId.team: return 'account-multiple';
      case SystemStreamId.watching: return 'eye';
      case SystemStreamId.subscription: return 'volume-high';
    }
  }

  async getAllSystemStreams(): Promise<{error?: Error; systemStreams?: StreamEntity[]}> {
    const {error, rows} = await DB.select<SystemStreamRow>('select * from system_streams order by position');
    if (error) return {error};

    const systemStreams = await this.convert(rows);

    return {systemStreams};
  }

  async getSystemStream(streamId: number): Promise<{error?: Error; systemStream?: StreamEntity}> {
    const {error, row} = await DB.selectSingle<SystemStreamRow>('select * from system_streams where id = ?', [streamId]);
    if (error) return {error};

    const systemStreams = await this.convert([row]);

    return {systemStream: systemStreams[0]};
  }

  async updateSearchedAt(streamId: number, utcString: string): Promise<{error?: Error}> {
    const {error} = await DB.exec(`update system_streams set searched_at = ? where id = ?`, [utcString, streamId]);
    if (error) return {error};

    return {}
  }

  async updateSystemStream(streamId: number, enabled: number, notification: number): Promise<{error?: Error}> {
    const {error} = await DB.exec(`update system_streams set enabled = ?, notification = ? where id = ?`, [enabled, notification, streamId]);
    if (error) return {error};

    return {}
  }

  isSystemStreamId(streamId: number) {
    return [
      SystemStreamId.me,
      SystemStreamId.team,
      SystemStreamId.watching,
      SystemStreamId.subscription,
    ].includes(streamId);
  }
}

export const SystemStreamRepo = new _SystemStreamRepo();
