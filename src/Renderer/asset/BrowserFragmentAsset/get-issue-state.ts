(function(){
  const url = new URL(location.href);
  const matched = url.pathname.match(new RegExp('^/([^/]+/[^/]+)/([^/]+)/(\\d+)'));
  if (matched && matched[1] && matched[2] && matched[3]) {
    const repo = matched[1];

    let issueType;
    if (matched[2] === 'issues') {
      issueType = 'issue';
    } else if (matched[2] === 'pull') {
      issueType = 'pr';
    } else {
      return;
    }

    const issueNumber = parseInt(matched[3], 10);
    const issueState = document.querySelector('.State').textContent.trim().toLowerCase();

    // ref GetIssueEntity.ts
    const res = {repo, issueType, issueNumber, issueState};
    console.log(`GET_ISSUE_STATE:${JSON.stringify(res)}`);
  }
})();
