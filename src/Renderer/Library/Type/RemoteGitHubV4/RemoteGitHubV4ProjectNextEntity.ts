import {RemoteGitHubV4Entity} from './RemoteGitHubV4Entity';
import {RemoteGitHubV4ProjectNextFieldValue} from './RemoteGitHubV4IssueNodesEntity';

export type RemoteGitHubV4ProjectNextFieldEntity = Omit<RemoteGitHubV4ProjectNextFieldValue['projectField'], 'project'>;

export type RemoteGitHubV4ProjectNextEntity =  RemoteGitHubV4Entity & {
  user?: {
    projectNext?: {
      fields: {
        nodes: RemoteGitHubV4ProjectNextFieldEntity[];
      }
    }
  }
  organization?: {
    projectNext?: {
      fields: {
        nodes: RemoteGitHubV4ProjectNextFieldEntity[];
      }
    }
  }
};
