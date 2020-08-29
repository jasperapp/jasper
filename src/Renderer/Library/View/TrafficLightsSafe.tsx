import React from 'react';
import styled from 'styled-components';
import {View} from './View';
import {DragBar} from './DragBar';
import ReactDOM from 'react-dom';
import {AppIPC} from '../../../IPC/AppIPC';
import {TimerUtil} from '../Util/TimerUtil';

type Props = {
}

type State = {
  show: boolean;
}

export class TrafficLightsSafe extends React.Component<Props, State> {
  state: State = {
    show: false,
  }

  componentDidMount() {
    AppIPC.onToggleLayout(() => this.handleLayout());
  }

  private async handleLayout() {
    await TimerUtil.sleep(16);
    const el = ReactDOM.findDOMNode(this) as HTMLElement;
    const rect = el.getBoundingClientRect();
    if (rect.left < TrafficLightSize.width) {
      this.setState({show: true});
    } else {
      this.setState({show: false});
    }
  }

  render() {
    const display = this.state.show ? 'block' : 'none';

    return (
      <Root>
        <DragBar/>
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
`
