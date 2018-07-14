(function(){
  const prevReadAt = _prevReadAt_;

  function highlightComment(comment, prevReadAt) {
    const timeEl = comment.querySelector('relative-time, time');
    if (!timeEl) return;

    const time = new Date(timeEl.getAttribute('datetime')).getTime();
    if (time > prevReadAt) {
      comment.classList.add('highlight-comment');
      return true;
    }
  }

  {
    const comments = document.querySelectorAll('.review-comment');
    for (const comment of Array.from(comments)) {
      highlightComment(comment, prevReadAt);
    }
  }

  {
    const comments = document.querySelectorAll('.discussion-item-review');
    for (const comment of Array.from(comments)) {
      highlightComment(comment, prevReadAt);
    }
  }

  {
    const comments = document.querySelectorAll('.timeline-comment');
    for (const comment of Array.from(comments)) {
      highlightComment(comment, prevReadAt);
    }
  }

  {
    const containers = document.querySelectorAll('.outdated-comment, .discussion-item');
    for (const container of Array.from(containers)) {
      const comment = container.querySelector('.highlight-comment');
      if (comment) container.classList.add('open');
    }
  }
})();
