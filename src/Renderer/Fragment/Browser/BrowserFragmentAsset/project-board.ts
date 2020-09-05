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
}

(function() {
  const projectBoard = new JasperProjectBoard();
  projectBoard.initStyle();
})();
