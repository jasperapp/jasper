(function(){
  window.addEventListener('contextmenu', (ev)=>{
    let el = ev.target as HTMLElement;
    let url = null;
    while (el) {
      if (el instanceof HTMLAnchorElement && el.tagName === 'A' && el.href) {
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
