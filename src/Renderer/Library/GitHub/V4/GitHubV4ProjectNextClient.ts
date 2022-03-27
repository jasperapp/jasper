import {GitHubV4Client} from './GitHubV4Client';
import {RemoteGitHubV4ProjectNextEntity, RemoteGitHubV4ProjectNextFieldEntity} from '../../Type/RemoteGitHubV4/RemoteGitHubV4ProjectNextEntity';

export class GitHubV4ProjectNextClient extends GitHubV4Client {
  async getProjectStatusFieldNames(projectUrl: string): Promise<{ error?: Error; iterationName?: string; statusNames?: string[] }> {
    // fetch data
    const query = this.buildQuery(projectUrl);
    const {error, data} = await this.request<RemoteGitHubV4ProjectNextEntity>(query);
    if (error != null) return {error};

    // iteration
    const iterationField = this.getIterationField(data);
    const iterationName = iterationField?.name;

    // status
    const statusField = this.getStatusField(data);
    if (statusField == null) return {statusNames: [], iterationName};
    const settings = JSON.parse(statusField.settings) as { options: { name: string }[] };
    const statusNames = settings.options.map(option => option.name);

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

  private getIterationField(data: RemoteGitHubV4ProjectNextEntity): RemoteGitHubV4ProjectNextFieldEntity | null {
    if (data.user?.projectNext != null) {
      return data.user.projectNext.fields.nodes.find(field => field.dataType === 'ITERATION');

    } else if (data.organization?.projectNext != null) {
      return data.organization.projectNext.fields.nodes.find(field => field.dataType === 'ITERATION');
    }
  }

  private getStatusField(data: RemoteGitHubV4ProjectNextEntity): RemoteGitHubV4ProjectNextFieldEntity | null {
    if (data.user?.projectNext != null) {
      return data.user.projectNext.fields.nodes.find(field => {
        return field.dataType === 'SINGLE_SELECT' && field.name.toLocaleLowerCase() === 'status' && field.settings != null;
      });

    } else if (data.organization?.projectNext != null) {
      return data.organization.projectNext.fields.nodes.find(field => {
        return field.dataType === 'SINGLE_SELECT' && field.name.toLocaleLowerCase() === 'status' && field.settings != null;
      });
    }
  }
}

const queryTemplate = `
__QUERY_TYPE__(login: "__USER_NAME__") {
  projectNext(number: __PROJECT_NUMBER__) {
    title
    fields(first: 100) {
      nodes {
        dataType
        name
        settings
      }
    }
  }
}
`;