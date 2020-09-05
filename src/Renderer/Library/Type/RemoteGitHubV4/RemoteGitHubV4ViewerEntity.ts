import {RemoteGitHubV4Entity} from './RemoteGitHubV4Entity';

export type RemoteGitHubV4ViewerEntity = RemoteGitHubV4Entity & {
  viewer: {
    login: string;
  }
}
