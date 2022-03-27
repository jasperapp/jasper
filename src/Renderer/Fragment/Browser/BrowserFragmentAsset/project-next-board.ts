{
  type IssueEntity = {
    id: number;
    repo: string;
    number: number;
    isRead: boolean;
  }

  class JasperProjectNextBoard {
    // @ts-ignore
    private issues: IssueEntity[] = __ISSUES__;
    // @ts-ignore
    private isDarkMode: boolean = __IS_DARK_MODE__;

    init() {
      this.initStyle();
      this.initHandler();
    }

    private initStyle() {
      const styles: string[] = [];

      // unread style
      const background = this.isDarkMode ? '#163043' : '#dfedff';
      const border = '#2984ff';
      for (const issue of this.issues) {
        if (issue.isRead) continue;
        const style = `
        div[data-hovercard-subject-tag="issue:${issue.id}"] > div {
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
        div[data-hovercard-subject-tag="issue:${issue.id}"] > div {
          background: #00000011 !important;
        }
        
        div[data-hovercard-subject-tag="issue:${issue.id}"] span[role="tooltip"] span {
          background: transparent;
        }
        `;
        styles.push(style);
      }

      const currentStyleEl = document.querySelector('#jasper-project-next-board-style');
      if (currentStyleEl) {
        currentStyleEl.parentElement.removeChild(currentStyleEl);
      }

      const styleEl = document.createElement('style');
      styleEl.id = `jasper-project-next-board-style`;
      styleEl.textContent = styles.join('\n');
      document.head.appendChild(styleEl);
    }

    private initHandler() {
      window.addEventListener('click', (ev) => {
        const el = ev.target as HTMLElement;
        if (el.tagName === 'A') {
          const url = el.getAttribute('href');
          this.readIssue(url);
          this.initStyle();
        }
      }, true);
    }

    // issueUrl = `https://github.com/foo/bar/ISSUE_TYPE/12`
    private readIssue(issueUrl: string) {
      const pathname = new URL(issueUrl).pathname;
      const tmp = pathname.split('/');
      const repo = `${tmp[1]}/${tmp[2]}`;
      const number = parseInt(tmp[4], 10);
      const issue = this.issues.find(issue => issue.repo === repo && issue.number === number);
      if (issue) issue.isRead = true;
    }
  }

  new JasperProjectNextBoard().init();
}
