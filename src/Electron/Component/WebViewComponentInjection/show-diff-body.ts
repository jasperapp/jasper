(function(){
  const diffEl = document.createElement('div');
  diffEl.className = 'diff-body';

  // diff toggle header
  const headerEl = document.createElement('header');
  headerEl.textContent = 'This issue body was updated. Click here to display/hide the difference.';
  headerEl.addEventListener('click', ()=>{
    diffContainerEl.style.display = diffContainerEl.style.display ? null : 'block';
    console.log('OPEN_DIFF_BODY:');
  });

  const diffContainerEl = document.createElement('div');

  // diff word
  const diffWordEl = document.createElement('pre');
  diffWordEl.innerHTML = `_diffBodyHTML_Word_`;
  diffContainerEl.appendChild(diffWordEl);

  // diff char
  const diffCharEl = document.createElement('pre');
  diffCharEl.innerHTML = `_diffBodyHTML_Char_`;
  diffCharEl.style.display = 'none';
  diffContainerEl.appendChild(diffCharEl);

  // diff word/char toggle
  const diffTypeToggleEl = document.createElement('div');
  diffTypeToggleEl.className = 'diff-type-toggle';
  diffTypeToggleEl.textContent = 'C';
  diffTypeToggleEl.title = 'toggle diff type: word/char';
  diffTypeToggleEl.addEventListener('click', ()=>{
    if (diffWordEl.style.display === 'none') {
      diffWordEl.style.display = null;
      diffCharEl.style.display = 'none';
      diffTypeToggleEl.textContent = 'C';
    } else {
      diffWordEl.style.display = 'none';
      diffCharEl.style.display = null;
      diffTypeToggleEl.textContent = 'W';
    }
  });
  diffContainerEl.appendChild(diffTypeToggleEl);

  diffEl.appendChild(headerEl);
  diffEl.appendChild(diffContainerEl);

  const refEl = document.querySelector('.timeline-comment-group .comment .edit-comment-hide');
  document.querySelector('.timeline-comment-group .comment').insertBefore(diffEl, refEl);
})();
