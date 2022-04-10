import React from 'react';
import {Modal} from '../../Library/View/Modal';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {Text} from '../../Library/View/Text';
import {font, fontWeight, space} from '../../Library/Style/layout';
import {Link} from '../../Library/View/Link';
import {appTheme} from '../../Library/Style/appTheme';
import {UserPrefIPC} from '../../../IPC/UserPrefIPC';
import {shell} from 'electron';
import {MainWindowIPC} from '../../../IPC/MainWindowIPC';
import {Translate} from '../../Library/View/Translate';
import {DocsUtil} from '../../Library/Util/DocsUtil';

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
    MainWindowIPC.onShowExportData(() => this.setState({show: true}));
  }

  private async handleOpenDataDir() {
    const {userPrefPath} = await UserPrefIPC.getEachPaths();
    shell.showItemInFolder(userPrefPath);
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
