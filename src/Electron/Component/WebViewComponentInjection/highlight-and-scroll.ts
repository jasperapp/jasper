{
  // @ts-ignore
  const prevReadAt = _prevReadAt_;
  const highlightCommentEls: Element[] = [];

  exec();

  async function exec() {
    // highlight comment
    await openResolvedThread();
    await replaceEditedTime();
    highlightComments();
    closeNoHighlightResolvedThread();

    // scroll to latest
    scrollToHighlight();

    // add highlight indicator
    addHighlightIndicator();
  }

  async function replaceEditedTime() {
    const editHistories = Array.from(document.querySelectorAll('.js-comment-edit-history-menu')).map(el => el.parentElement);
    for (const editHistory of editHistories) {
      editHistory.setAttribute('open', 'true');
      // @ts-ignore
      editHistory.querySelector('details-menu').style.opacity = 0;
    }

    // wait for loading
    for (let i = 0; i < 30; i++) {
      await sleep(30);

      let loadedCount = 0;
      for (const editHistory of editHistories) {
        if (editHistory.querySelector('relative-time')) loadedCount++;
      }
      if (loadedCount === editHistories.length) break;
    }

    // replace
    const comments = Array.from(document.querySelectorAll('.review-comment, .discussion-item-review, .timeline-comment'));
    for (const comment of comments) {
      const editedTimeEl = comment.querySelector('.js-comment-edit-history-menu relative-time');
      if (editedTimeEl) {
        const editedTime = new Date(editedTimeEl.getAttribute('datetime'));
        const timeEl = comment.querySelector('.js-timestamp relative-time');
        timeEl && timeEl.setAttribute('datetime', dateUTCFormat(editedTime));
      }
    }

    // close
    for (const editHistory of editHistories) {
      editHistory.removeAttribute('open');
      // @ts-ignore
      editHistory.querySelector('details-menu').style.opacity = 1;
    }
  }

  async function openResolvedThread() {
    const containers = Array.from(
      document.querySelectorAll('.js-resolvable-timeline-thread-container[data-resolved="true"]:not(.has-inline-notes)')
    );

    if (containers.length) {
      // outdatedしている箇所を一度openして、中身を読み込ませる
      for (const container of containers) {
        container.setAttribute('open', 'true');
      }

      // 全てのresolvedの中が読み込まれるまで待機
      for (let i = 0; i < 30; i++) {
        await sleep(30);

        let loadedCount = 0;
        for (const container of containers) {
          if (container.classList.contains('has-inline-notes')) loadedCount++;
        }
        if (loadedCount === containers.length) break;
      }
    }
  }

  function closeNoHighlightResolvedThread() {
    const containers = Array.from(
      document.querySelectorAll('.js-resolvable-timeline-thread-container[data-resolved="true"]')
    );
    for (const container of containers) {
      const comment = container.querySelector('.highlight-comment');
      if (!comment) container.removeAttribute('open');
    }
  }

  function highlightComments() {
    const comments = Array.from(document.querySelectorAll('.review-comment, .discussion-item-review, .timeline-comment'));
    for (const comment of comments) {
      const timeEl = comment.querySelector('.js-timestamp relative-time');
      if (!timeEl) continue;

      const time = new Date(timeEl.getAttribute('datetime')).getTime();
      if (time > prevReadAt) {
        comment.classList.add('highlight-comment');
        highlightCommentEls.push(comment);
      }
    }
  }

  function addHighlightIndicator() {
    if (!highlightCommentEls.length) return;
    // if (!prevReadAt) return;

    const indicatorEl = document.createElement('div');
    indicatorEl.classList.add('highlight-indicator');
    document.body.appendChild(indicatorEl);

    const height = document.body.getBoundingClientRect().height;
    for (const comment of highlightCommentEls) {
      const absY = comment.getBoundingClientRect().top + window.pageYOffset;
      const y = absY / height * 100;

      const div = document.createElement('div');
      div.classList.add('highlight-indicator-mark');
      div.style.top = `${y}%`;
      indicatorEl.appendChild(div);

      div.addEventListener('click', () => {
        comment.scrollIntoView({block: 'center'});
        div.style.opacity = '0.4';
      });
    }
  }

  function scrollToHighlight() {
    const comment = document.querySelector('.highlight-comment');
    comment && comment.scrollIntoView({block: 'center'});
  }

  function sleep(msec) {
    return new Promise((resolve) => {
      setTimeout(resolve, msec);
    });
  }

  function dateUTCFormat(date: Date): string {
    const Y = date.getUTCFullYear();
    const M = `${date.getUTCMonth() + 1}`.padStart(2, '0');
    const D = `${date.getUTCDate()}`.padStart(2, '0');
    const h = `${date.getUTCHours()}`.padStart(2, '0');
    const m = `${date.getUTCMinutes()}`.padStart(2, '0');
    const s = `${date.getUTCSeconds()}`.padStart(2, '0');

    return `${Y}-${M}-${D}T${h}:${m}:${s}Z`;
  }
}
