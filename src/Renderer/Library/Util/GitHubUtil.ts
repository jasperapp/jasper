import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {IssueEntity} from '../Type/IssueEntity';
import {IconNameType} from '../Type/IconNameType';
import {color} from '../Style/color';

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
    const host = UserPrefRepo.getPref().github.webHost;

    let isIssue = !!url.match(new RegExp(`^https://${host}/[\\w\\d-_.]+/[\\w\\d-_.]+/issues/\\d+$`));
    let isPR = !!url.match(new RegExp(`^https://${host}/[\\w\\d-_.]+/[\\w\\d-_.]+/pull/\\d+$`));

    return isIssue || isPR;
  }

  getIssueTypeInfo(issue: IssueEntity): {icon: IconNameType; color: string; label: string} {
    if (issue.value.pull_request) {
      if (issue.merged_at) {
        return {icon: 'source-merge', color: color.issue.merged, label: 'Merged'};
      }

      if (issue.value.closed_at) {
        return {icon: 'source-pull', color: color.issue.closed, label: 'Closed'};
      }

      if (issue.value.draft) {
        return {icon: 'source-pull', color: color.issue.draft, label: 'Draft'};
      }

      return {icon: 'source-pull', color: color.issue.open, label: 'Open'};
    } else {
      const icon = 'alert-circle-outline';
      if (issue.value.closed_at) {
        return {icon, color: color.issue.closed, label: 'Closed'};
      } else {
        return {icon, color: color.issue.open, label: 'Open'};
      }
    }
  }

  isTargetIssuePage(url: string, issue: IssueEntity): boolean {
    if (!url) return false;
    if (!issue) return false;

    const targetUrlObj = new URL(url);
    const issueUrlObj = new URL(issue.html_url);

    if (targetUrlObj.origin !== issueUrlObj.origin) return false;

    // `/a/b/pull/99`と`/a/b/pull/9`を区別するために末尾にスラッシュを入れる。
    return `${targetUrlObj.pathname}/`.indexOf(`${issueUrlObj.pathname}/`) === 0;
  }
}

export const GitHubUtil = new _GitHubUtil();
