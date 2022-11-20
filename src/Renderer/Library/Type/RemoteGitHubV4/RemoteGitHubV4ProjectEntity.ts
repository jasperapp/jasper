import {RemoteGitHubV4Entity} from './RemoteGitHubV4Entity';
import {RemoteGitHubV4ProjectFieldValue} from './RemoteGitHubV4IssueNodesEntity';

export type RemoteGitHubV4ProjectFieldEntity = Omit<RemoteGitHubV4ProjectFieldValue['field'], 'project'>;

export type RemoteGitHubV4ProjectEntity = RemoteGitHubV4Entity & {
  user?: {
    projectV2?: {
      fields: {
        nodes: RemoteGitHubV4ProjectFieldEntity[];
      }
    }
  }
  organization?: {
    projectV2?: {
      fields: {
        nodes: RemoteGitHubV4ProjectFieldEntity[];
      }
    }
  }
};
