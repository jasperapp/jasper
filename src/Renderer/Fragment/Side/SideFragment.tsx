import React from 'react';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {appTheme} from '../../Library/Style/appTheme';
import {border} from '../../Library/Style/layout';
import {HorizontalResizer} from '../../Library/View/HorizontalResizer';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';

type Props = {
  className?: string;
}

type State = {
  width: number;
}

const MIN_WIDTH = 220;

export class SideFragment extends React.Component<Props, State> {
  state: State = {
    width: UserPrefRepo.getPref().general.style.streamsWidth || MIN_WIDTH,
  }

  private handleResize(diff: number) {
    const width = Math.max(this.state.width + diff, MIN_WIDTH);
    this.setState({width});
  }

  private handleWriteWidth() {
    const pref = UserPrefRepo.getPref();
    pref.general.style.streamsWidth = this.state.width;
    UserPrefRepo.updatePref(pref);
  }

  render() {
    return (
      <Root className={this.props.className} style={{width: this.state.width}}>
        {this.props.children}
        <HorizontalResizer onResize={diff => this.handleResize(diff)} onEnd={() => this.handleWriteWidth()}/>
      </Root>
    );
  }
}

const Root = styled(View)`
  position: relative;
  height: 100%;
  background: ${() => appTheme().bg.secondary};
  border-right: solid ${border.medium}px ${() => appTheme().border.normal};
`;

