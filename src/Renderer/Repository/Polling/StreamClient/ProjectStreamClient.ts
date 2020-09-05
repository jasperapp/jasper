import {StreamClient} from './StreamClient';
import {GitHubUtil} from '../../../Library/Util/GitHubUtil';

export class ProjectStreamClient extends StreamClient {
  constructor(id: number, name: string, queries: string[], searchedAt: string) {
    const projectUrl = queries[0];
    const projectBoard = GitHubUtil.getProjectBoard(projectUrl);
    const projectQuery = [`project:${projectBoard}`];

    super(id, name, projectQuery, searchedAt);
  }
}
