// {
//   const mountFragment = require('../../Fragment/IssueWindowFragment').mountFragment;
//   window.addEventListener('DOMContentLoaded', () => {
//     mountFragment();
//   });
// }

import {contextBridge} from 'electron';

contextBridge.exposeInMainWorld('native', {});
