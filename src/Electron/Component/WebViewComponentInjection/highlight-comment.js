(async function(){
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

  function sleep(msec) {
    return new Promise((resolve) => {
      setTimeout(resolve, msec);
    });
  }

  // outdatedが非同期になってしまったので、一度openして中を読み込ませてから、処理を行う
  // todo: GHEの場合、リクエストが増えるのが心配
  {
    const containers = document.querySelectorAll('.outdated-comment');

    if (containers.length) {
      // outdatedしている箇所を一度openして、中身を読み込ませる
      for (const container of Array.from(containers)) {
        container.setAttribute('open', true);
        container.removeAttribute('open');
      }

      // 最後のoutdatedの中が読み込まれるまで待機
      const lastContainer = containers[containers.length - 1];
      for (let i = 0; i < 10; i++) {
        await sleep(100);
        if (lastContainer.querySelector('.review-comment')) break;
      }
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
      if (comment) {
        container.setAttribute('open', true);
        container.classList.add('open'); // for old style(GHE ~2018.08)
      }
    }
  }
})();
