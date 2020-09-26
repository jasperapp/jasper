import {StreamClient} from './StreamClient/StreamClient';
import {TimerUtil} from '../../Library/Util/TimerUtil';
import {SystemStreamTeamClient} from './StreamClient/SystemStreamTeamClient';
import {SystemStreamWatchingClient} from './StreamClient/SystemStreamWatchingClient';
import {SystemStreamSubscriptionClient} from './StreamClient/SystemStreamSubscriptionClient';
import {StreamIPC} from '../../../IPC/StreamIPC';
import {UserPrefRepo} from '../UserPrefRepo';
import {StreamEvent} from '../../Event/StreamEvent';
import {StreamEntity} from '../../Library/Type/StreamEntity';
import {StreamId, StreamRepo} from '../StreamRepo';
import {ProjectStreamClient} from './StreamClient/ProjectStreamClient';

type Task = {
  streamClient: StreamClient;
  priority: number;
}

class _StreamPolling {
  private queue: Task[] = [];
  private currentName: string;

  constructor() {
    StreamIPC.onStopAllStreams(async () => {
      await this.stop()
    });
    StreamIPC.onRestartAllStreams(async () => {
      await this.restart();
    });
  }

  async start() {
    await this.createStreamClients();
    this.run();
  }

  async stop() {
    this.queue = [];
    this.currentName = null;
  }

  async restart() {
    await this.stop();
    this.start();
    StreamEvent.emitReloadAllStreams();
  }

  async refreshStream(streamId: number) {
    await this.deleteStream(streamId);

    const {error, stream} = await StreamRepo.getStream(streamId);
    if (error) return console.error(error);
    if (stream.type !== 'UserStream' && stream.type !== 'SystemStream' && stream.type !== 'ProjectStream') return console.error(`stream is not UserStream and SystemStream and ProjectStream. streamId = ${streamId}`);

    if (stream.enabled) {
      const streamClient = await this.createStreamClient(stream);
      this.push(streamClient, 1);
    }
  }

  async deleteStream(streamId: number) {
    this.queue = this.queue.filter(task => task.streamClient.getId() !== streamId);
  }

  getStreamQueries(streamId: number): string[] {
    const task = this.queue.find(task => task.streamClient.getId() === streamId);
    if (!task) return [];

    return task.streamClient.getQueries();
  }

  private async createStreamClients() {
    const {error: e1, streams: systemStreams} = await StreamRepo.getAllStreams(['SystemStream']);
    if (e1) return console.error(e1);

    const {error: e2, streams: userStreams} = await StreamRepo.getAllStreams(['UserStream', 'ProjectStream']);
    if (e2) return console.error(e2);

    // system streamsを先にポーリングさせる
    for (const streamEntity of [...systemStreams, ...userStreams]) {
      if (!streamEntity.enabled) continue;
      const streamClient = await this.createStreamClient(streamEntity);
      this.push(streamClient, streamClient.getIsFirstSearching() ? 1 : 0);
    }
  }

  private async createStreamClient(streamEntity: StreamEntity): Promise<StreamClient> {
    switch (streamEntity.id) {
      case StreamId.team:
        return new SystemStreamTeamClient(streamEntity.id, streamEntity.name, streamEntity.searchedAt);
      case StreamId.watching:
        return new SystemStreamWatchingClient(streamEntity.id, streamEntity.name, streamEntity.searchedAt);
      case StreamId.subscription:
        return new SystemStreamSubscriptionClient(streamEntity.id, streamEntity.name, streamEntity.searchedAt);
    }

    if (streamEntity.type === 'UserStream') {
      return new StreamClient(streamEntity.id, streamEntity.name, streamEntity.queries, streamEntity.searchedAt);
    } else if (streamEntity.type === 'ProjectStream') {
      return new ProjectStreamClient(streamEntity.id, streamEntity.name, streamEntity.queries, streamEntity.searchedAt);
    } else {
      throw new Error(`unknown stream. stream.id = ${streamEntity.id}, stream.type = ${streamEntity.type}`);
    }
  }

  private push(streamClient: StreamClient, priority = 0) {
    // 自分以上のpriorityの直後に挿入する
    // e.g. priorityが[2,1,1,0,0]でqueueにpriority = 1を入れると[2,1,1,1,0,0]となる
    let index = 0;
    for (let i = this.queue.length - 1; i >= 0; i--) {
      if (this.queue[i].priority >= priority) {
        index = i + 1;
        break;
      }
    }
    const task = {streamClient, priority}
    this.queue.splice(index, 0, task);
  }

  private isExist(streamClient: StreamClient): boolean {
    return !!this.queue.find(task => task.streamClient.getId() === streamClient.getId());
  }

  private async run() {
    const currentName = this.currentName = `polling:${Date.now()}`;

    while(1) {
      if (currentName !== this.currentName) return;
      if (!this.queue.length) return;

      // exec stream
      const {streamClient} = this.queue[0];
      const {fulfillRateLimit} = await streamClient.exec();

      // exec()してる間にstreamが削除された場合、stream clientをpushしてはいけない
      // なので、queueに存在している場合のみ、stream clientをpushする
      if (this.isExist(streamClient)) {
        await this.deleteStream(streamClient.getId());
        this.push(streamClient, streamClient.getIsFirstSearching() ? 1 : 0);
      }

      // rate-limitに引っかかってしまった場合、intervalを伸ばす
      if (fulfillRateLimit) {
        const pref = UserPrefRepo.getPref();
        pref.github.interval++;
        await UserPrefRepo.updatePref(pref);
      }

      // wait interval
      const interval = UserPrefRepo.getPref().github.interval * 1000;
      await TimerUtil.sleep(interval);
    }
  }
}

export const StreamPolling = new _StreamPolling();
