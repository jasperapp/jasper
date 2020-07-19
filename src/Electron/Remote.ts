import electron from 'electron';
import {DB} from '../DB/DB';
import {BrowserViewProxy} from '../BrowserViewProxy';
import {Config} from '../Config';

const remote = electron.remote;
export const RemoteDB: DB = remote.require('./DB/DB.js').default;
export const RemoteLogger = remote.require('color-logger').default;
export const RemoteStreamLauncher = remote.require('./Stream/StreamLauncher').default;
export const RemoteSystemStreamLauncher = remote.require('./Stream/SystemStreamLauncher').default;
export const RemoteStreamEmitter = remote.require('./Stream/StreamEmitter.js').default;
export const RemoteConfig: typeof Config = remote.require('./Config.js').Config;
export const RemoteGitHubClient = remote.require('./GitHub/GitHubClient.js').default;
export const RemoteIssuesTable = remote.require('./DB/IssuesTable.js').default;
export const RemoteStreamsIssuesTable = remote.require('./DB/StreamsIssuesTable.js').default;
export const RemoteGA = remote.require('./Util/GA').default;
export const RemoteDateConverter = remote.require('./Util/DateConverter.js').default;
export const RemoteBrowserViewProxy: typeof BrowserViewProxy = remote.require('./BrowserViewProxy').BrowserViewProxy;
export const RemoteBootstrap = remote.require('./Bootstrap.js').default;
