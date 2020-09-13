import React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import {appTheme} from '../Style/appTheme';

interface Props {
  onResize: (diff: number) => void;
  onEnd: () => void;
}

export class HorizontalResizer extends React.Component<Props> {
  private ref;
  private onMouseMove;
  private onMouseUp;

  handleResizeStart() {
    const el = (ReactDOM.findDOMNode(this.ref) as HTMLElement);
    let rect = el.getBoundingClientRect();

    this.onMouseMove = (ev: MouseEvent) => {
      const diff = ev.clientX - rect.left;
      this.props.onResize(diff);
      rect = el.getBoundingClientRect();
    };

    this.onMouseUp = (_ev) => {
      document.head.removeChild(styleEl);
      document.body.removeEventListener('mousemove', this.onMouseMove);
      document.body.removeEventListener('mouseup', this.onMouseUp);
      delete document.body.style.cursor;
      this.props.onEnd();
    };

    const styleEl = document.createElement('style');
    styleEl.innerText = '* {cursor: col-resize !important}';
    document.head.appendChild(styleEl);

    document.body.addEventListener('mousemove', this.onMouseMove);
    document.body.addEventListener('mouseup', this.onMouseUp);
  }

  render() {
    return <ResizableBorder onMouseDown={this.handleResizeStart.bind(this)} ref={ref => this.ref = ref}/>
  }
}

const ResizableBorder = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  cursor: col-resize;
  width: 5px;
  height: 100%;
  
  &:hover {
    border-right: solid 1px ${() => appTheme().border.normal};
  }
`;
