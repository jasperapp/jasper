class _GitHubUtil {
  getInfo(url: string): {repo: string; issueNumber: number, user: string} {
    const urlPaths = url.split('/').reverse();
    const repo = `${urlPaths[3]}/${urlPaths[2]}`;
    const issueNumber = parseInt(urlPaths[0], 10);
    const user = urlPaths[3];
    return {repo, issueNumber, user};
  }
}

export const GitHubUtil = new _GitHubUtil();
