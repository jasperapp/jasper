(function(){
  const containers = document.querySelectorAll('.outdated-comment, .outdated-diff-comment-container');
  for (const container of Array.from(containers)) {
    container.classList.add('open');
  }
})();
