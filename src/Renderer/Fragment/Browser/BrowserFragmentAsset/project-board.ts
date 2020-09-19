type IssueEntity = {
  id: number;
  repo: string;
  number: number;
  isRead: boolean;
}

(function() {
  class JasperProjectBoard {
    // @ts-ignore
    private issues: IssueEntity[] = __ISSUES__;
    // @ts-ignore
    private isDarkMode: boolean = __IS_DARK_MODE__;

    initStyle() {
      const styles: string[] = [];

      // unread style
      const background = this.isDarkMode ? '#163043' : '#dfedff';
      const border = '#2984ff';
      for (const issue of this.issues) {
        if (issue.isRead) continue;
        const style = `
        div.issue-card[data-content-id="${issue.id}"], /* for old GHE */
        article.issue-card[data-content-id="${issue.id}"] {
          background: ${background} !important;
          border: solid 1px ${border} !important;
        }
        `;
        styles.push(style);
      }

      // read style
      for (const issue of this.issues) {
        if (!issue.isRead) continue;
        const style = `
        div.issue-card[data-content-id="${issue.id}"], /* for old GHE */
        article.issue-card[data-content-id="${issue.id}"] {
          background: #00000011 !important;
        }
        div.issue-card[data-content-id="${issue.id}"] a, /* for old GHE */
        article.issue-card[data-content-id="${issue.id}"] a {
          color: #00000088 !important;
        }`;
        styles.push(style);
      }

      const currentStyleEl = document.querySelector('#jasper-project-board-style');
      if (currentStyleEl) {
        currentStyleEl.parentElement.removeChild(currentStyleEl);
      }

      const styleEl = document.createElement('style');
      styleEl.id = `jasper-project-board-style`;
      styleEl.textContent = styles.join('\n');
      document.head.appendChild(styleEl);
    }

    setupClickIssueDetail() {
      window.addEventListener('click', (ev) => {
        const label = (ev.target as HTMLElement).textContent?.trim().toLowerCase();
        let action: 'select' | 'close' | 'reopen';
        switch (label) {
          case 'go to issue for full details':
          case 'go to pull request for full details':
            ev.stopPropagation();
            ev.preventDefault();
            action = 'select';
            break;
          case 'close issue':
          case 'close pull request':
            action = 'close';
            break;
          case 'reopen issue':
          case 'reopen pull request':
            action = 'reopen';
            break;
          default:
            return;
        }

        // find issue url
        let parent: HTMLElement = ev.target as HTMLElement;
        let url;
        while (parent) {
          url = parent.getAttribute('data-issue-url');
          if (url) break;
          parent = parent.parentElement;
        }
        if (!url) return;

        // message to parent
        console.log(`PROJECT_BOARD_ACTION:${JSON.stringify({action, url})}`);

        // update read state
        if (action === 'select') {
          this.readIssue(url);
          this.initStyle();
        }
      }, true);
    }

    // issueUrl = `/foo/bar/ISSUE_TYPE/12`
    private readIssue(issueUrl: string) {
      const tmp = issueUrl.replace(/^[/]/, '').split('/');
      const repo = `${tmp[0]}/${tmp[1]}`;
      const number = parseInt(tmp[3], 10);
      const issue = this.issues.find(issue => issue.repo === repo && issue.number === number);
      if (issue) issue.isRead = true;
    }
  }

  const projectBoard = new JasperProjectBoard();
  projectBoard.initStyle();
  projectBoard.setupClickIssueDetail();
})();
