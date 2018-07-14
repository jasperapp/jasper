(function(){
  const prevReadAt = _prevReadAt_;
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

  if (target) {
    target.scrollIntoView();
    if (updatedBody) {
      const scrollEl = document.createElement('div');
      scrollEl.className = 'scroll-to-top';
      scrollEl.textContent = 'This issue body was updated. Click here to scroll to top.';
      scrollEl.addEventListener('click', ()=>{
        window.scrollTo(0, 0);
        document.querySelector('.diff-body > div').style.display = 'block';
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
