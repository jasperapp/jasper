// import {ipcMain, ipcRenderer} from 'electron';
// import {StreamEntity} from '../../Renderer/Library/Type/StreamEntity';
// import {StreamIPCChannels} from './StreamIPC.channel';
//
// class _StreamIPC {
//   // export streams
//   // async exportStreams(streams: StreamEntity[]) {
//   //   return ipcRenderer.invoke(StreamIPCChannels.exportStreams, streams);
//   // }
//   //
//   // onExportStreams(handler: (_ev, streams: StreamEntity[]) => Promise<void>) {
//   //   ipcMain.handle(StreamIPCChannels.exportStreams, handler);
//   // };
//
//   // import streams
//   async importStreams(): Promise<StreamEntity[]> {
//     return ipcRenderer.invoke(StreamIPCChannels.importStreams);
//   }
//
//   onImportStreams(handler: () => Promise<StreamEntity[]>) {
//     ipcMain.handle(StreamIPCChannels.importStreams, handler);
//   };
// }
//
// export const StreamIPC = new _StreamIPC();
