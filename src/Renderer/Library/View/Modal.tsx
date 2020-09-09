import React, {CSSProperties} from 'react';
import styled from 'styled-components';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';
import {space} from '../Style/layout';

type Props = {
  show: boolean;
  onClose: () => void;
  style?: CSSProperties;
  draggable?: boolean;
}

type State = {
}

export class Modal extends React.Component<Props, State> {
  private onKeyup;

  componentDidMount() {
    this.onKeyup = (ev) => {
      if (this.props.show && ev.key === 'Escape') this.handleClose();
    };
    window.addEventListener('keyup', this.onKeyup);
  }

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    if (this.props.show && !prevProps.show) {
      BrowserViewIPC.hide(true);
    } else if (!this.props.show && prevProps.show) {
      BrowserViewIPC.hide(false);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('keyup', this.onKeyup);
  }

  private handleClose(ev?: React.MouseEvent) {
    ev?.preventDefault();
    ev?.stopPropagation();
    this.props.onClose();
  }

  render() {
    if (!this.props.show) return null;

    const draggableClassName = this.props.draggable ? 'modal-draggable' : '';
    return (
      <Root onClick={(ev) => this.handleClose(ev)} className={draggableClassName}>
        <Container style={this.props.style} onClick={ev => ev.stopPropagation()}>
          {this.props.children}
        </Container>
      </Root>
    );
  }
}

const Root = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background-color: #00000088;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;

  &.modal-draggable {
    -webkit-app-region: drag;
  }

  &.modal-draggable > * {
    -webkit-app-region: none;
  }
`;

const Container = styled.div`
  background-color: #ffffff;
  box-shadow: 0 0 8px 4px #00000030; 
  padding: ${space.large}px;
  width: auto;
  height: auto;
  max-height: 100%;
  display: flex;
  border-radius: 4px;
  overflow: hidden;
  flex-direction: column;
  box-sizing: border-box;
`;

