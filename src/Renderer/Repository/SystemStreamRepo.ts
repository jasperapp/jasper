import {DBIPC} from '../../IPC/DBIPC';
import {SystemStreamEntity} from '../Type/StreamEntity';
import {IssueRepo} from './IssueRepo';

export enum SystemStreamId {
  me = -1,
  team = -2,
  watching = -3,
  subscription = -4,
}

class _SystemStreamRepo {
  private async relations(systemStreams: SystemStreamEntity[]) {
    if (!systemStreams.length) return;
    await this.relationType(systemStreams);
    await this.relationIconName(systemStreams);
    await this.relationDefaultFilter(systemStreams);
    await this.relationUnreadCount(systemStreams);
  }

  private async relationType(systemStreams: SystemStreamEntity[]) {
    systemStreams.forEach(s => s.type = 'systemStream');
  }

  private async relationIconName(systemStreams: SystemStreamEntity[]) {
    systemStreams.forEach(s => {
      switch (s.id) {
        case SystemStreamId.me: return s.iconName = 'account';
        case SystemStreamId.team: return s.iconName = 'account-multiple';
        case SystemStreamId.watching: return s.iconName = 'eye';
        case SystemStreamId.subscription: return s.iconName ='volume-high';
      }
    });
  }

  private async relationDefaultFilter(systemStreams: SystemStreamEntity[]) {
    systemStreams.forEach(s => s.defaultFilter = 'is:unarchived');
  }

  private async relationUnreadCount(systemStreams: SystemStreamEntity[]) {
    const promises = systemStreams.map(s => IssueRepo.getUnreadCountInStream(s.id, s.defaultFilter));
    const results = await Promise.all(promises);
    const error = results.find(res => res.error)?.error;
    if (error) return;

    systemStreams.forEach((s, index) => s.unreadCount = results[index].count);
  }

  async getAllSystemStreams(): Promise<{error?: Error; systemStreams?: SystemStreamEntity[]}> {
    const {error, rows} = await DBIPC.select<SystemStreamEntity>('select * from system_streams order by position');
    if (error) return {error};

    await this.relations(rows);

    return {systemStreams: rows};
  }

  async getSystemStream(streamId: number): Promise<{error?: Error; systemStream?: SystemStreamEntity}> {
    const {error, row} = await DBIPC.selectSingle<SystemStreamEntity>('select * from system_streams where id = ?', [streamId]);
    if (error) return {error};

    await this.relations([row]);

    return {systemStream: row};
  }

  async updateSearchedAt(streamId: number, utcString: string): Promise<{error?: Error}> {
    const {error} = await DBIPC.exec(`update system_streams set searched_at = ? where id = ?`, [utcString, streamId]);
    if (error) return {error};

    return {}
  }

  async updateSystemStream(streamId: number, enabled: number, notification: number): Promise<{error?: Error}> {
    const {error} = await DBIPC.exec(`update system_streams set enabled = ?, notification = ? where id = ?`, [enabled, notification, streamId]);
    if (error) return {error};

    return {}
  }
}

export const SystemStreamRepo = new _SystemStreamRepo();
