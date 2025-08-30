export {};

declare global {
  interface IPC {}
  interface Window { ipc: IPC }
}
