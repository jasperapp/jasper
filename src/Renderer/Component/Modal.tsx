import React, {CSSProperties} from 'react';
import styled from 'styled-components';
import {BrowserViewIPC} from '../../IPC/BrowserViewIPC';

type Props = {
  show: boolean;
  onClose: () => void;
  style?: CSSProperties;
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

  componentWillUnmount() {
    window.removeEventListener('keyup', this.onKeyup);
  }

  private handleClose() {
    this.props.onClose();
    BrowserViewIPC.hide(false);
  }

  render() {
    if (!this.props.show) return null;

    BrowserViewIPC.hide(true);

    return (
      <Root onClick={() => this.handleClose()}>
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
`;

const Container = styled.div`
  background-color: #ffffff;
  width: 300px;
  height: 300px;
  display: flex;
  border-radius: 4px;
  overflow: hidden;
  flex-direction: column;
`;

