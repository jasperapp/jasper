(function(){
  const containers = document.querySelectorAll('.outdated-comment, .outdated-diff-comment-container');
  for (const container of Array.from(containers)) {
    container.setAttribute('open', 'true');
    container.classList.add('open'); // for old style(GHE ~2018.08)
  }
})();
