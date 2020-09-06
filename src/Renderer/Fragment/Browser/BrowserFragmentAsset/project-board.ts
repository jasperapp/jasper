type IssueEntity = {
  id: number;
}

class JasperProjectBoard {
  // @ts-ignore
  private unreadIssues: IssueEntity[] = __UNREAD_ISSUES__;
  // @ts-ignore
  private readIssues: IssueEntity[] = __READ_ISSUES__;

  initStyle() {
    const fragment = document.createDocumentFragment();
    for (const unreadIssue of this.unreadIssues) {
      const styleEl = document.createElement('style');
      styleEl.id = `issue-id-${unreadIssue.id}`;
      styleEl.textContent = `
      article.issue-card[data-content-id="${unreadIssue.id}"]:after {
        content: "●";
        position: absolute;
        top: 0;
        left: 2px;
        font-size: 9px;
        color: #2984ff;
      }
    `;
      fragment.appendChild(styleEl);
    }

    for (const readIssue of this.readIssues) {
      const styleEl = document.createElement('style');
      styleEl.id = `issue-id-${readIssue.id}`;
      styleEl.textContent = `
      article.issue-card[data-content-id="${readIssue.id}"] {
        background: #00000011 !important;
      }
      article.issue-card[data-content-id="${readIssue.id}"] a {
        color: #00000088 !important;
      }
    `;
      fragment.appendChild(styleEl);
    }

    document.head.appendChild(fragment);
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

      let parent: HTMLElement = ev.target as HTMLElement;
      let url;
      while (parent) {
        url = parent.getAttribute('data-issue-url');
        if (url) break;
        parent = parent.parentElement;
      }

      if (!url) return;

      console.log(`PROJECT_BOARD_ACTION:${JSON.stringify({action, url})}`);
    }, true);
  }
}

(function() {
  const projectBoard = new JasperProjectBoard();
  projectBoard.initStyle();
  projectBoard.setupClickIssueDetail();
})();
