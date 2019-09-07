const Logger = require('electron').remote.require('color-logger').default;
const logs = Logger.allLogs;
const fragment = document.createDocumentFragment();
for (const log of logs) {
  const el = document.createElement('li');
  el.textContent = log;
  el.classList.add(logLevel(log));
  fragment.appendChild(el);
}

const logsEl = document.querySelector('#logs');
logsEl.appendChild(fragment);
logsEl.scrollTop = logsEl.scrollHeight;

function logLevel(log) {
  const level = log.match(/^.../)[0];
  switch (level) {
    case '[N]': return 'level-normal';
    case '[D]': return 'level-debug';
    case '[E]': return 'level-error';
    case '[W]': return 'level-warning';
    case '[I]': return 'level-info';
    case '[V]': return 'level-verbose';
  }
}
