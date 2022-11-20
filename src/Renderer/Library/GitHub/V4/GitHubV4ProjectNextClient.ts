import {RemoteGitHubV4ProjectEntity, RemoteGitHubV4ProjectFieldEntity} from '../../Type/RemoteGitHubV4/RemoteGitHubV4ProjectEntity';
import {GitHubV4Client} from './GitHubV4Client';

export class GitHubV4ProjectNextClient extends GitHubV4Client {
  async getProjectStatusFieldNames(projectUrl: string): Promise<{ error?: Error; iterationName?: string; statusNames?: string[] }> {
    // fetch data
    const query = this.buildQuery(projectUrl);
    const {error, data} = await this.request<RemoteGitHubV4ProjectEntity>(query);
    if (error != null) return {error};

    // iteration
    const iterationField = this.getIterationField(data);
    const iterationName = iterationField?.name;

    // status
    const statusField = this.getStatusField(data);
    if (statusField == null) return {statusNames: [], iterationName};
    const statusNames = statusField.options.map(option => option.name);

    return {statusNames, iterationName};
  }

  private buildQuery(projectUrl: string): string {
    const [, orgOrUser, userName, , projectNumber] = new URL(projectUrl).pathname.split('/');
    const queryType = orgOrUser === 'orgs' ? 'organization' : 'user';
    return queryTemplate
      .replace('__QUERY_TYPE__', queryType)
      .replace('__USER_NAME__', userName)
      .replace('__PROJECT_NUMBER__', projectNumber);
  }

  private getIterationField(data: RemoteGitHubV4ProjectEntity): RemoteGitHubV4ProjectFieldEntity | null {
    if (data.user?.projectV2 != null) {
      return data.user.projectV2.fields.nodes.find(field => field.dataType === 'ITERATION');
    } else if (data.organization?.projectV2 != null) {
      return data.organization.projectV2.fields.nodes.find(field => field.dataType === 'ITERATION');
    }
  }

  private getStatusField(data: RemoteGitHubV4ProjectEntity): RemoteGitHubV4ProjectFieldEntity | null {
    if (data.user?.projectV2 != null) {
      return data.user.projectV2.fields.nodes.find(field => {
        return field.dataType === 'SINGLE_SELECT' && field.name.toLocaleLowerCase() === 'status' && field.options != null;
      });

    } else if (data.organization?.projectV2 != null) {
      return data.organization.projectV2.fields.nodes.find(field => {
        return field.dataType === 'SINGLE_SELECT' && field.name.toLocaleLowerCase() === 'status' && field.options != null;
      });
    }
  }
}

const queryTemplate = `
__QUERY_TYPE__(login: "__USER_NAME__") {
  projectV2(number: __PROJECT_NUMBER__) {
    title
    fields(first: 100) {
      nodes {
        ... on ProjectV2SingleSelectField { name dataType options { name } } 
        ... on ProjectV2IterationField {name dataType }
      }
    }
  }
}
`;
