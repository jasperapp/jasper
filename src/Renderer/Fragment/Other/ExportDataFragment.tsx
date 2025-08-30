import React from 'react';
import styled from 'styled-components';
import {MainWindowIPCChannels} from '../../../IPC/MainWindowIPC/MainWindowIPC.channel';
import {appTheme} from '../../Library/Style/appTheme';
import {font, fontWeight, space} from '../../Library/Style/layout';
import {DocsUtil} from '../../Library/Util/DocsUtil';
import {Link} from '../../Library/View/Link';
import {Modal} from '../../Library/View/Modal';
import {Text} from '../../Library/View/Text';
import {Translate} from '../../Library/View/Translate';
import {View} from '../../Library/View/View';

type Props = {
}

type State = {
  show: boolean;
}

export class ExportDataFragment extends React.Component<Props, State> {
  state: State = {
    show: false,
  }

  componentDidMount() {
    window.ipc.on(MainWindowIPCChannels.showExportData, () => this.setState({show: true}));
  }

  private async handleOpenDataDir() {
    const {userPrefPath} = await window.ipc.userPref.getEachPaths();
    window.ipc.electron.shell.showItemInFolder(userPrefPath);
  }

  render() {
    return (
      <Modal show={this.state.show} onClose={() => this.setState({show: false})}>
        <Root>
          <TitleRow>
            <Title><Translate onMessage={mc => mc.exportData.title}/></Title>
            <Link url={DocsUtil.getDataMigrationURL()}><Translate onMessage={mc => mc.exportData.help}/></Link>
          </TitleRow>
          <ExportDesc>1. <Link onClick={() => this.handleOpenDataDir()}><Translate onMessage={mc => mc.exportData.step1}/></Link></ExportDesc>
          <ExportDesc>2. <Translate onMessage={mc => mc.exportData.step2} values={{config:<ExportDescHighlight>config.json</ExportDescHighlight>, db: <ExportDescHighlight>main*.db</ExportDescHighlight>}}/></ExportDesc>
          <ExportDesc>3. <Translate onMessage={mc => mc.exportData.step3}/></ExportDesc>
        </Root>
      </Modal>
    );
  }
}

const Root = styled(View)`
  width: 600px;
`;

const TitleRow = styled(View)`
  flex-direction: row;
  align-items: center;
  padding-bottom: ${space.medium}px;
`;

const Title = styled(Text)`
  font-size: ${font.large}px;
  font-weight: ${fontWeight.bold};
  padding-right: ${space.medium}px;
`;

const ExportDesc = styled(Text)`
  padding-bottom: ${space.medium}px;
`;

const ExportDescHighlight = styled(Text)`
  background: ${() => appTheme().bg.primarySoft};
  font-weight: ${fontWeight.bold};
  padding: ${space.tiny}px ${space.small}px;
  display: inline-block;
  border-radius: 4px;
`;
