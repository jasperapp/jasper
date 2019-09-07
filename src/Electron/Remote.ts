import electron from 'electron';
import {DB} from '../DB/DB';

const remote = electron.remote;
export const RemoteDB: DB = remote.require('./DB/DB.js').default;
export const RemoteLogger = remote.require('color-logger').default;
export const RemoteStreamLauncher = remote.require('./Stream/StreamLauncher').default;
export const RemoteSystemStreamLauncher = remote.require('./Stream/SystemStreamLauncher').default;
export const RemoteStreamEmitter = remote.require('./Stream/StreamEmitter.js').default;
export const RemoteConfig = remote.require('./Config.js').default;
export const RemoteGitHubClient = remote.require('./GitHub/GitHubClient.js').default;
export const RemoteIssuesTable = remote.require('./DB/IssuesTable.js').default;
export const RemoteStreamsIssuesTable = remote.require('./DB/StreamsIssuesTable.js').default;
