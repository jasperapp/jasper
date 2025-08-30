import {ipcMain} from 'electron';
import {StreamService} from '../../Main/Service/StreamService';
import {StreamEntity} from '../../Renderer/Library/Type/StreamEntity';
import {StreamIPCChannels} from './StreamIPC.channel';

export function streamIPCBind() {
  ipcMain.handle(StreamIPCChannels.unreadCount, (_ev, unreadCount, badge) => {
    return StreamService.setUnreadCount(unreadCount, badge);
  });

  ipcMain.handle(StreamIPCChannels.exportStreams, (_ev, streams: StreamEntity[]) => {
    return StreamService.exportStreams(streams);
  });

  ipcMain.handle(StreamIPCChannels.importStreams, (_ev) => {
    return StreamService.importStreams();
  });
}
