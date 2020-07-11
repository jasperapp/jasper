{
  // @ts-ignore
  const prevReadAt = _prevReadAt_;
  const highlightCommentEls: HTMLElement[] = [];

  exec();

  async function exec() {
    // prepare
    insertTimeIntoReviewBody();
    await openResolvedThread();
    await replaceEditedTime();

    // highlight comment
    highlightComments();

    // close prepare
    closeNoHighlightResolvedThread();

    // add highlight indicator
    addHighlightIndicator();

    // scroll to latest
    await scrollToHighlight();
  }

  function getComments() {
    const comments = Array.from(document.querySelectorAll('.review-comment, .discussion-item-review, .timeline-comment'));
    comments.pop(); // コメントフォームを削除
    return comments
  }

  function insertTimeIntoReviewBody() {
    for (const comment of getComments()) {
      const timeEl = comment.querySelector('relative-time');
      if (timeEl) continue;

      const parent = getParent(comment, 'js-comment');
      if (!parent) continue;

      const parentTimeEl = parent.querySelector('relative-time');
      if (!parentTimeEl) continue;

      comment.querySelector('.timeline-comment-header-text').appendChild(parentTimeEl.cloneNode())
    }
  }

  async function replaceEditedTime() {
    const editHistories = Array.from(document.querySelectorAll('.js-discussion details'))
      .filter(el => el.querySelector('.js-comment-edit-history-menu'));
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

    // close
    for (const editHistory of editHistories) {
      editHistory.removeAttribute('open');
      // @ts-ignore
      editHistory.querySelector('details-menu').style.opacity = 1;
    }

    // replace
    for (const comment of getComments()) {
      const editedTimeEl = comment.querySelector('.js-comment-edit-history-menu relative-time');
      if (!editedTimeEl) continue;

      const editedTime = new Date(editedTimeEl.getAttribute('datetime'));
      const timeEls = comment.querySelectorAll('relative-time');
      for (const timeEl of timeEls) timeEl.setAttribute('datetime', dateUTCFormat(editedTime));
    }
  }

  async function openResolvedThread() {
    const containers = Array.from(
      document.querySelectorAll('.js-resolvable-timeline-thread-container[data-resolved="true"]:not(.has-inline-notes)')
    );

    // GHE(2.19.5)ではoutdatedはresolvedされてなくても閉じられてしまうので、resolvedと同じようにopenする
    {
      const outdatedContainers = Array.from(
        document.querySelectorAll('.js-resolvable-timeline-thread-container:not(.has-inline-notes)')
      ).filter(el => el.querySelector('.js-toggle-outdated-comments'));
      containers.push(...outdatedContainers);
    }

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
    for (const comment of getComments()) {
      const rect = comment.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;

      const timeEl = comment.querySelector('relative-time');
      if (!timeEl) continue;

      const time = new Date(timeEl.getAttribute('datetime')).getTime();
      if (time > prevReadAt) {
        comment.classList.add('highlight-comment');
        highlightCommentEls.push(comment as HTMLElement);
      }
    }
  }

  function addHighlightIndicator() {
    if (!highlightCommentEls.length) return;

    // create indicator wrap
    const indicatorWrapEl = document.createElement('div');
    indicatorWrapEl.classList.add('highlight-indicator-wrap');
    document.body.appendChild(indicatorWrapEl);

    // create indicator
    const indicatorEl = document.createElement('div');
    indicatorEl.classList.add('highlight-indicator');
    indicatorWrapEl.appendChild(indicatorEl);

    // create current-pos
    const currentPosEl = document.createElement('div') ;
    currentPosEl.classList.add('highlight-indicator-scroll-current-pos');
    currentPosEl.style.opacity = '0';
    indicatorEl.appendChild(currentPosEl);

    // calc timeline height
    function getTimelineHeight() {
      const lastCommentBottom = getComments().pop().getBoundingClientRect().bottom + window.scrollY;
      const timelineRect = document.querySelector('.js-discussion').getBoundingClientRect();
      const timelineBottom = timelineRect.bottom + window.scrollY;
      const timelineHeight = timelineRect.height - (timelineBottom - lastCommentBottom);
      return {timelineHeight, timelineRect};
    }
    const {timelineHeight, timelineRect} = getTimelineHeight();
    const timelineOffset = timelineRect.top + window.pageYOffset; //.js-discussionのheightを使うために、commentの絶対位置をオフセットする必要がある

    // タイムラインの高さが小さいときは、インジケータも小さくする
    const indicatorHeight = Math.min(timelineHeight / window.innerHeight, 1);
    indicatorEl.style.height = `${indicatorHeight * 100}%`;

    // コメントが画面に表示されたときにmarkを非表示にする
    // https://blog.jxck.io/entries/2016-06-25/intersection-observer.html#intersection-observer
    const highlightCommentMarkMap: Map<HTMLElement, HTMLElement> = new Map();
    const observer = new IntersectionObserver((changes) => {
      for (let change of changes) {
        if (change.isIntersecting) {
          const mark = highlightCommentMarkMap.get(change.target as HTMLElement);
          if (mark) mark.classList.add('highlight-indicator-mark-done');
        }
      }
    }, {threshold: [0], rootMargin: '-40px'});

    // create mark
    for (const comment of highlightCommentEls) {
      // calc mark position
      const commentRect = comment.getBoundingClientRect();
      if (!commentRect.width || !commentRect.height) continue;
      const absYOnViewPort = commentRect.top + window.pageYOffset;
      const absYOnTimeline = absYOnViewPort - timelineOffset;
      const y = absYOnTimeline / timelineHeight * 100;

      // calc mark size
      const absHeight = commentRect.height;
      const height = absHeight / timelineHeight * 100;

      // create mark
      // const markOffset = (50 - y) / 50 * 10; // markの位置がindicatorの上下ぴったりに来ないように、「中央(50%)を原点として、そこからの距離で0~10のオフセット」をつける
      const mark = document.createElement('div');
      mark.classList.add('highlight-indicator-mark');
      // mark.style.top = `calc(${y}% + ${markOffset}px)`;
      mark.style.top = `${y}%`;
      mark.style.height = `${height}%`;
      indicatorEl.appendChild(mark);

      // intersection
      observer.observe(comment);
      highlightCommentMarkMap.set(comment, mark);

      // click mark
      mark.addEventListener('click', async () => {
        await scrollToComment(comment, false);
        // const marks = Array.from(indicatorEl.querySelectorAll('.highlight-indicator-mark')) as HTMLElement[];
        // recursiveMarkDone(mark, marks);
      });
    }

    // scroll position
    if (timelineRect.bottom > window.innerHeight) {
      window.addEventListener('wheel', async () => {
        const windowTop = window.scrollY;
        const windowBottom =  window.scrollY + window.innerHeight;
        const {timelineHeight, timelineRect} = getTimelineHeight();
        const timelineTop = timelineRect.top + window.scrollY;
        const top = Math.min(timelineHeight, Math.max(0, windowTop - timelineTop));
        const bottom = Math.max(0, Math.min(timelineHeight, windowBottom - timelineTop));
        const height = (bottom - top) / timelineHeight;

        currentPosEl.style.top = `${top/timelineHeight * 100}%`;
        currentPosEl.style.height = `${height * 100}%`;
        currentPosEl.style.opacity = null;
        currentPosEl.style.display = null;
        currentPosEl.style.transition = null;
        currentPosEl.ontransitionend = null;

        const t = Date.now().toString();
        currentPosEl.dataset['time'] = t;
        await sleep(300);
        if (currentPosEl.dataset['time'] === t) {
          currentPosEl.style.opacity = '0';
          currentPosEl.style.transition = 'opacity 0.2s';
          currentPosEl.ontransitionend = () => currentPosEl.style.display = 'none';
        }
      });
    }
  }

  // function recursiveMarkDone(doneMark: HTMLElement, marks: HTMLElement[]) {
  //   doneMark.classList.add('highlight-indicator-mark-done');
  //   const rect = doneMark.getBoundingClientRect();
  //   const doneTop = Math.floor(rect.top);
  //   const doneBottom = Math.ceil(rect.top + rect.height);
  //
  //   for (const mark of marks) {
  //     if (mark.classList.contains('highlight-indicator-mark-done')) continue;
  //     const rect = mark.getBoundingClientRect();
  //     const top = Math.floor(rect.top);
  //     const bottom = Math.ceil(rect.top + rect.height);
  //     if (bottom >= doneTop && bottom <= doneBottom) {
  //       mark.classList.add('highlight-indicator-mark-done');
  //       recursiveMarkDone(mark, marks);
  //     }
  //     if (top >= doneTop && top <= doneBottom) {
  //       mark.classList.add('highlight-indicator-mark-done');
  //       recursiveMarkDone(mark, marks);
  //     }
  //   }
  // }

  async function scrollToHighlight() {
    const comment = document.querySelector('.highlight-comment');
    if (comment) {
      await scrollToComment(comment, true);
    } else {
      const comments = getComments();
      if (comments.length) {
        const lastComment = comments[comments.length - 1];
        await scrollToComment(lastComment, true);
      }
    }
  }

  function sleep(msec) {
    return new Promise((resolve) => {
      setTimeout(resolve, msec);
    });
  }

  function getParent(target, clazz) {
    let result = target.parentElement;
    while (result) {
      if (result.classList.contains(clazz)) return result;
      result = result.parentElement;
    }

    return null;
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

  async function scrollToComment(comment: Element, notScrollIfTop: boolean) {
    if (!comment) return;
    if (notScrollIfTop && comment === document.querySelector('.timeline-comment')) return;

    comment.scrollIntoView({block: 'start'});
    await sleep(10);
    window.scrollBy(0, -80); //ヘッダーの分だけさらに移動する
  }
}
