import React from 'react';
import ReactDOM from 'react-dom';
import {View} from '../../Library/View/View';
import styled from 'styled-components';
import {BrowserViewIPC} from '../../../IPC/BrowserViewIPC';
import {Text} from '../../Library/View/Text';
import {border, font, space} from '../../Library/Style/layout';
import {appTheme} from '../../Library/Style/appTheme';
import {PlatformUtil} from '../../Library/Util/PlatformUtil';
import {color} from '../../Library/Style/color';
import {Link} from '../../Library/View/Link';
import {AppEvent} from '../../Event/AppEvent';

type Props = {
}

type State = {
}

export class BrowserFrameFragment extends React.Component<Props, State> {
  componentDidMount() {
    this.setupBrowserResize();
    BrowserViewIPC.hide(true);

    BrowserViewIPC.setBackgroundColor(appTheme().bg.primary);
    AppEvent.onChangedTheme(this, () => BrowserViewIPC.setBackgroundColor(appTheme().bg.primary));
  }

  componentWillUnmount() {
    AppEvent.offAll(this);
  }

  private setupBrowserResize() {
    const el = ReactDOM.findDOMNode(this) as HTMLElement;
    // @ts-ignore
    const resizeObserver = new ResizeObserver(_entries => {
      const rect = el.getBoundingClientRect();
      BrowserViewIPC.setRect(rect.x, rect.y, rect.width, rect.height);
    });
    resizeObserver.observe(el);
  }

  render() {
    const cmdKey = PlatformUtil.select('⌘', 'Ctrl');
    return (
      <Root>
        <Row>
          <Desc>Jump Navigation</Desc>
          <Key>{cmdKey} + K</Key>
        </Row>
        <Row>
          <Desc>Notification On/Off</Desc>
          <Key>{cmdKey} + I</Key>
        </Row>
        <Row>
          <Desc>Change Pane Layout</Desc>
          <Key>{cmdKey} + 1</Key>
          <Key>{cmdKey} + 2</Key>
          <Key>{cmdKey} + 3</Key>
        </Row>

        <View style={{height: 30}}/>
        <Row>
          <Desc>Only Unread Issue on List</Desc>
          <Key>U</Key>
        </Row>
        <Row>
          <Desc>Next or Previous Stream on List</Desc>
          <Key>D</Key> <Key>F</Key>
        </Row>
        <Row>
          <Desc>Next or Previous Issue on List</Desc>
          <Key>J</Key> <Key>K</Key>
        </Row>
        <Row>
          <Desc>Page Down or Up on Browser</Desc>
          <Key>Space</Key> <Key>Shift + Space</Key>
        </Row>

        <Handbook><Link url='https://docs.jasperapp.io/' style={{fontSize: font.large}}>Jasper Handbook</Link> describes all keyboard shortcuts, streams, filter and more.</Handbook>
      </Root>
    );
  };
}

const Root = styled(View)`
  flex: 1;
  width: 100%;
  align-items: center;
  justify-content: center;
`;

const Row = styled(View)`
  flex-direction: row;
  align-items: center;
  min-width: 400px;
  padding: ${space.medium2}px 0;
  border-bottom: solid ${border.medium}px ${() => appTheme().border.normal};
  overflow: visible;
`;

const Desc = styled(Text)`
  flex: 1;
  font-weight: bold;
`;

const Key = styled(Text)`
  display: inline-block;
  padding: ${space.small}px ${space.medium}px;
  margin-left: ${space.medium}px;
  border-radius: 4px;
  min-width: 40px;
  text-align: center;
  _box-shadow: 1px 1px 0 0 #00000080;
  box-shadow: 1px 1px 2px 0 #9a0039;
  border: solid ${border.medium}px ${() => appTheme().border.normal};
  background: ${color.brand};
  color: ${color.white};
  font-weight: bold;
`;

const Handbook = styled(Text)`
  font-size: ${font.large}px;
  padding-top: 40px;
`;

