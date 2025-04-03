import {StreamClient} from './StreamClient';
import {IssueEntity} from '../../../Library/Type/IssueEntity';
import {Logger} from '../../../Library/Infra/Logger';

// GitHub Projects classic has been sunset, so this client now returns an empty list of issues
export class ProjectStreamClient extends StreamClient {
  constructor(id: number, name: string, queries: string[], searchedAt: string) {
    super(id, name, [], searchedAt);
    Logger.warning(ProjectStreamClient.name, 'GitHub Projects classic has been sunset. This stream will return no issues.');
  }

  async getIssues(): Promise<{issues: IssueEntity[]; hasError: boolean}> {
    return {issues: [], hasError: false};
  }
}
