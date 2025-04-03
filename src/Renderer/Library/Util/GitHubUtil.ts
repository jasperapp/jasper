import {color} from '../Style/color';
import {IconNameType} from '../Type/IconNameType';
import {IssueEntity} from '../Type/IssueEntity';

class _GitHubUtil {
  getInfo(url: string): {repo: string; issueNumber: number, user: string, repoOrg: string, repoName: string} {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    const urlPaths = pathname.split('/').reverse();
    const repoOrg = urlPaths[3];
    const repoName = urlPaths[2];
    const repo = `${repoOrg}/${repoName}`;
    const issueNumber = parseInt(urlPaths[0], 10);
    return {repo, issueNumber, user: repoOrg, repoOrg, repoName};
  }

  isIssueUrl(host: string, url: string): boolean {
    if (!url) return false;

    const urlObj = new URL(url);
    if (urlObj.host !== host) return false;

    const isIssue = !!urlObj.pathname.match(new RegExp(`^/[\\w\\d-_.]+/[\\w\\d-_.]+/issues/\\d+$`));
    const isPR = !!urlObj.pathname.match(new RegExp(`^/[\\w\\d-_.]+/[\\w\\d-_.]+/pull/\\d+$`));

    return isIssue || isPR;
  }

  getIssueTypeInfo(issue: IssueEntity): {icon: IconNameType; color: string; label: string, state: string} {
    if (issue.value.pull_request) {
      if (issue.merged_at) {
        return {icon: 'source-merge', color: color.issue.merged, label: 'Merged', state: 'merged'};
      }

      if (issue.value.closed_at) {
        return {icon: 'source-pull', color: color.issue.prClosed, label: 'Closed', state: 'closed'};
      }

      if (issue.value.draft) {
        return {icon: 'source-pull', color: color.issue.draft, label: 'Draft', state: 'draft'};
      }

      return {icon: 'source-pull', color: color.issue.open, label: 'Open', state: 'open'};
    } else {
      if (issue.value.closed_at) {
        return {icon: 'check-circle-outline', color: color.issue.closed, label: 'Closed', state: 'closed'};
      } else {
        return {icon: 'record-circle-outline', color: color.issue.open, label: 'Open', state: 'open'};
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
