import React from 'react';
import {AppIPC} from '../../IPC/AppIPC';

type Props = {
}

type State = {
}

export class KeyboardShortcutFragment extends React.Component<Props, State> {
  componentDidMount() {
    window.addEventListener('keyup', this.handleKeyUpBind);
    window.addEventListener('click', this.handleClickAndFocusBind, true);
    window.addEventListener('focus', this.handleClickAndFocusBind, true);
  }

  componentWillUnmount() {
    window.removeEventListener('keyup', this.handleKeyUpBind);
    window.removeEventListener('click', this.handleClickAndFocusBind, true);
    window.removeEventListener('focus', this.handleClickAndFocusBind, true);
  }

  // private setupDetectInput() {
  //   function detect(ev) {
  //     // const el = ev.srcElement;
  //     // if (!el || !el.tagName) return;
  //     //
  //     // if (el.tagName.toLowerCase() === 'input' && !['checkbox', 'radio', 'file', 'submit', 'image', 'reset', 'button'].includes(el.type)) {
  //     //   AppIPC.keyboardShortcut(false);
  //     // } else if (el.tagName.toLowerCase() === 'textarea') {
  //     //   AppIPC.keyboardShortcut(false);
  //     // } else {
  //     //   AppIPC.keyboardShortcut(true);
  //     // }
  //   }
  //
  //   // window.addEventListener('click', detect, true);
  //   // window.addEventListener('focus', detect, true);
  //
  //   // window.addEventListener('keyup', (ev)=>{
  //   //   if (ev.key === 'Escape' && document.activeElement) {
  //   //     (document.activeElement as HTMLElement).blur();
  //   //     AppIPC.keyboardShortcut(true);
  //   //   } else if (ev.key === 'Enter' && document.activeElement) {
  //   //     detect(ev);
  //   //   }
  //   // });
  // }

  private handleClickAndFocusBind = (ev: MouseEvent | FocusEvent | KeyboardEvent) => {
    // const el = ev.srcElement as HTMLElement;
    const el = ev.target as HTMLElement;
    if (!el || !el.tagName) return;

    const tagName = el.tagName.toLowerCase();
    const inputTypes = ['checkbox', 'radio', 'file', 'submit', 'image', 'reset', 'button'];
    const inputType = (el as HTMLInputElement).type;
    if (tagName === 'input' && !inputTypes.includes(inputType)) {
      AppIPC.keyboardShortcut(false);
    } else if (tagName === 'textarea') {
      AppIPC.keyboardShortcut(false);
    } else {
      AppIPC.keyboardShortcut(true);
    }
  }

  private handleKeyUpBind = (ev: KeyboardEvent) => {
    if (ev.key === 'Escape' && document.activeElement) {
      (document.activeElement as HTMLElement).blur();
      AppIPC.keyboardShortcut(true);
    } else if (ev.key === 'Enter' && document.activeElement) {
      this.handleClickAndFocusBind(ev);
    }
  }

  render() {
    return null;
  }
}
