export enum SQLiteIPCChannel {
  exec = 'sqlite:exec',
  select = 'sqlite:select',
  selectSingle = 'sqlite:selectSingle',
  init = 'sqlite:init',
  deleteDBFile = 'sqlite:deleteDBFile',
}
