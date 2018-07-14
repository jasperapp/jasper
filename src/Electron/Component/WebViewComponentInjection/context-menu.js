(function(){
  window.addEventListener('contextmenu', (ev)=>{
    let el = ev.target;
    let url = null;
    while (el) {
      if (el.tagName === 'A' && el.href) {
        url = el.href;
        break;
      } else {
        el = el.parentElement;
      }
    }
    const text = window.getSelection().toString();

    const data = JSON.stringify({
      text: text,
      url: url
    });

    console.log(`CONTEXT_MENU:${data}`);
  });
})();
