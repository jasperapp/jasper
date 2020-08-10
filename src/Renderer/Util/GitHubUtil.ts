import {ConfigRepo} from '../Repository/ConfigRepo';

class _GitHubUtil {
  getInfo(url: string): {repo: string; issueNumber: number, user: string, repoOrg: string, repoName: string} {
    const urlPaths = url.split('/').reverse();
    const repoOrg = urlPaths[3];
    const repoName = urlPaths[2];
    const repo = `${repoOrg}/${repoName}`;
    const issueNumber = parseInt(urlPaths[0], 10);
    return {repo, issueNumber, user: repoOrg, repoOrg, repoName};
  }

  isIssueUrl(url: string) {
    if (!url) return false;
    const host = ConfigRepo.getConfig().github.webHost;

    let isIssue = !!url.match(new RegExp(`^https://${host}/[\\w\\d-_.]+/[\\w\\d-_.]+/issues/\\d+$`));
    let isPR = !!url.match(new RegExp(`^https://${host}/[\\w\\d-_.]+/[\\w\\d-_.]+/pull/\\d+$`));

    return isIssue || isPR;
  }
}

export const GitHubUtil = new _GitHubUtil();
