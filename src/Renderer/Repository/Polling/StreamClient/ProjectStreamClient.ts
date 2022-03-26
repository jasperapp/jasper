import {StreamClient} from './StreamClient';
import {GitHubUtil} from '../../../Library/Util/GitHubUtil';

export class ProjectStreamClient extends StreamClient {
  constructor(id: number, name: string, queries: string[], searchedAt: string) {
    const projectUrl = queries[0];
    const projectBoard = GitHubUtil.getProjectBoard(projectUrl);
    const projectQuery = [`project:${projectBoard}`];

    super(id, name, projectQuery, searchedAt);
  }

  // ForceUpdateIssuePollingによってproject issueを強制的に更新するようにした
  // // issueがprojectに追加されたり、project-columnが変更されても、issue.updated_atは更新扱いにならない。
  // // なので、検索APIをstream.searched_atつきで叩いていると、projectの変更をキャッチできない。
  // // そこで、ProjectStreamの場合はstream.searched_atをクエリにつけずに検索APIを叩くことにする。
  // // searched_atをつけないことで、サーバ側の負荷が少し心配。
  // protected isUsingSearchedAt(): boolean {
  //   return false;
  // }
}
