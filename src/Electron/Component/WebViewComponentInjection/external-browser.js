document.body.addEventListener('click', (evt)=>{
  // find url
  let url = null;
  {
    let el = evt.target;
    while (el) {
      if (el.tagName === 'A' && el.href) {
        url = el.href;
        break;
      } else {
        el = el.parentElement;
      }
    }
  }
  if (!url) return;

  // if always, open in external browser
  const alwaysOpenExternalUrlInExternalBrowser = _alwaysOpenExternalUrlInExternalBrowser_;
  if (alwaysOpenExternalUrlInExternalBrowser) {
    const linkHost = (new URL(url)).host;
    const thisHost = location.host;
    if (linkHost !== thisHost) {
      console.log('OPEN_EXTERNAL_BROWSER:' + url);
      evt.preventDefault();
      return;
    }
  }

  // if shift or cmd, open in external browser
  if (evt.shiftKey || evt.metaKey) {
    console.log('OPEN_EXTERNAL_BROWSER:' + url);
    evt.preventDefault();
  }
});
