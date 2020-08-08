import {ConfigRepo} from '../Repository/ConfigRepo';

class _GitHubUtil {
  getInfo(url: string): {repo: string; issueNumber: number, user: string} {
    const urlPaths = url.split('/').reverse();
    const repo = `${urlPaths[3]}/${urlPaths[2]}`;
    const issueNumber = parseInt(urlPaths[0], 10);
    const user = urlPaths[3];
    return {repo, issueNumber, user};
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
