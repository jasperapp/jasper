(function(){
  // @ts-ignore
  const prevReadAt = _prevReadAt_;
  // @ts-ignore
  const updatedBody = _updatedBody_;
  const els = Array.from(document.querySelectorAll('.timeline-comment, .review-comment, .discussion-item-review'));

  // remove description and text area
  els.shift();
  els.pop();

  if (!els.length) return;

  let target;
  for (const el of els) {
    const timeEl = el.querySelector('.timestamp relative-time, .timestamp time');
    if (!timeEl) continue;

    const time = new Date(timeEl.getAttribute('datetime')).getTime();
    if (time > prevReadAt) {
      target = el;
      break;
    }
  }

  function getParent(target, clazz) {
    let result = target;
    while (result) {
      if (result.classList.contains(clazz)) return result;
      result = result.parentElement;
    }

    return null;
  }

  if (target) {
    getParent(target, 'js-timeline-item').scrollIntoView();
    if (updatedBody) {
      const scrollEl = document.createElement('div');
      scrollEl.className = 'scroll-to-top';
      scrollEl.textContent = 'This issue body was updated. Click here to scroll to top.';
      scrollEl.addEventListener('click', ()=>{
        window.scrollTo(0, 0);
        (document.querySelector('.diff-body > div') as HTMLElement).style.display = 'block';
        console.log('OPEN_DIFF_BODY:');
      });
      document.querySelector('.js-discussion').appendChild(scrollEl);
    }
  } else if (updatedBody) {
    // no scroll
  } else {
    target = els[els.length - 1];
    target.scrollIntoView();
  }
})();
