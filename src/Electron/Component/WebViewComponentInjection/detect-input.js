{
  function detect(ev) {
    const el = ev.srcElement;
    if (!el || !el.tagName) return;

    if (el.tagName.toLowerCase() === 'input' && !['checkbox', 'radio', 'file', 'submit', 'image', 'reset', 'button'].includes(el.type)) {
      console.log('DETECT_INPUT:true');
    } else if (el.tagName.toLowerCase() === 'textarea') {
      console.log('DETECT_INPUT:true');
    } else {
      console.log('DETECT_INPUT:false');
    }
  }

  window.addEventListener('click', detect, true);
  window.addEventListener('focus', detect, true);
  window.addEventListener('keyup', (ev)=>{
    if (ev.keyCode === 13 && document.activeElement) {
      detect(ev);
    }
  });

  // <input autofocus="autofocus"> has already focus at dom-ready
  if (document.activeElement) detect({srcElement: document.activeElement});
}
