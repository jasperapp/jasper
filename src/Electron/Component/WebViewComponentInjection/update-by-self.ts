interface Window {
  __UPDATE_BY_SELF__: any;
}

(function(){
  window.__UPDATE_BY_SELF__ = window.__UPDATE_BY_SELF__ || {};

  const loginName = '_loginName_';
  let lastTime = {
    addComment: 0,
    updateComment: 0
  };

  function checkAddComment(mutations) {
    for (const mutation of mutations) {
      for (const el of Array.from(mutation.addedNodes) as HTMLElement[]) {
        if (!el || !el.querySelector) continue;

        const authorEl = el.querySelector('.author');
        if (!authorEl) continue;

        const author = authorEl.textContent;
        if (author !== loginName) continue;

        const now = Date.now();
        if (lastTime.addComment + 300 > now) continue;

        lastTime.addComment = now;
        console.log('UPDATE_BY_SELF:');

        return;
      }
    }
  }

  function checkUpdateComment(mutations) {
    const el = mutations[0].target;
    if (!el || !el.classList) return;

    if (!el.classList.contains('comment-body')) return;

    const now = Date.now();
    if (lastTime.updateComment + 300 > now) return;

    lastTime.updateComment = now;
    console.log('UPDATE_COMMENT_BY_SELF:');
  }

  // conversation tab
  {
    const target = document.querySelector('.js-discussion');
    if (target) {
      if (window.__UPDATE_BY_SELF__.conversation) {
        window.__UPDATE_BY_SELF__.conversation.disconnect();
      }

      const observer = new MutationObserver((mutations) => {
        checkAddComment(mutations);
        checkUpdateComment(mutations);
      });

      observer.observe(target, {subtree: true, childList: true});

      window.__UPDATE_BY_SELF__.conversation = observer;
    }
  }

  // files tab
  {
    const target = document.querySelector('#files.diff-view');
    if (target) {
      if (window.__UPDATE_BY_SELF__.files) {
        window.__UPDATE_BY_SELF__.files.disconnect();
      }

      const observer = new MutationObserver((mutations) => {
        checkAddComment(mutations);
        checkUpdateComment(mutations);
      });

      observer.observe(target, {subtree: true, childList: true});

      window.__UPDATE_BY_SELF__.files = observer;
    }
  }

  // submit review
  {
    window.addEventListener('beforeunload', () =>{
      const submitButton = document.querySelector('#submit-review button[type="submit"]');
      // if it has disabled, submit review
      if (submitButton && submitButton.hasAttribute('disabled')) {
        console.log('UPDATE_BY_SELF:');
      }
    });
  }
})();
