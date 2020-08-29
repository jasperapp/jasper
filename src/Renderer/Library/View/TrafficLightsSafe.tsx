import React from 'react';
import styled from 'styled-components';
import {View} from './View';
import ReactDOM from 'react-dom';
import {AppIPC} from '../../../IPC/AppIPC';
import {TimerUtil} from '../Util/TimerUtil';
import {space} from '../Style/layout';

type Props = {
  hideDragBar?: boolean;
}

type State = {
  show: boolean;
}

export class TrafficLightsSafe extends React.Component<Props, State> {
  state: State = {
    show: false,
  }

  componentDidMount() {
    this.handlePosition();
    AppIPC.onToggleLayout(() => this.handlePosition());
  }

  private async handlePosition() {
    await TimerUtil.sleep(16);
    const el = ReactDOM.findDOMNode(this) as HTMLElement;
    const rect = el.getBoundingClientRect();
    if (rect.left < TrafficLightSize.width) {
      this.setState({show: true});
    } else {
      this.setState({show: false});
    }
  }

  private handleMaximize() {
    AppIPC.toggleMaximizeWindow();
  }

  render() {
    const display = this.state.show ? 'flex' : 'none';

    return (
      <Root>
        <DragBar
          onDoubleClick={() => this.handleMaximize()}
          style={{display: this.props.hideDragBar ? 'none' : 'block'}}
        />
        <Inner style={{display}}>
          {this.props.children}
        </Inner>
      </Root>
    );
  }
}

const TrafficLightSize = {
  width: 70,
  height: 20,
};

const Root = styled(View)`
`;

const Inner = styled(View)`
  min-height: ${TrafficLightSize.height}px;
  margin-left: ${TrafficLightSize.width}px;
  -webkit-app-region: drag;
  
  & > * {
    -webkit-app-region: none;
  }
`;

const DragBar = styled.div`
  width: 100%;
  height: ${space.medium2}px;
  -webkit-app-region: drag;
  box-sizing: border-box;
`;
