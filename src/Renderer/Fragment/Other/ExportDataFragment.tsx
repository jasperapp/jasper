import React from 'react';
import {Modal} from '../../Library/View/Modal';
import styled from 'styled-components';
import {View} from '../../Library/View/View';
import {Text} from '../../Library/View/Text';
import {font, fontWeight, space} from '../../Library/Style/layout';
import {Link} from '../../Library/View/Link';
import {appTheme} from '../../Library/Style/appTheme';
import {UserPrefIPC} from '../../../IPC/UserPrefIPC';
import {shell} from "electron";
import {MainWindowIPC} from '../../../IPC/MainWindowIPC';

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
            <Title>Export Jasper data</Title>
            <Link url='https://docs.jasperapp.io/setup/data-transfer'>Help</Link>
          </TitleRow>
          <ExportDesc>1. <Link onClick={() => this.handleOpenDataDir()}>Open data directory</Link>.</ExportDesc>
          <ExportDesc>2. Copy all <ExportDescHighlight>config.json</ExportDescHighlight>, <ExportDescHighlight>main*.db</ExportDescHighlight> from the directory to user desktop.</ExportDesc>
          <ExportDesc>3. Import these data when setting up Jasper on a new machine.</ExportDesc>
        </Root>
      </Modal>
    );
  }
}

const Root = styled(View)`
  width: 500px;
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
