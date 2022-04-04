import React from 'react';
import {Button} from '../../../Library/View/Button';
import {border, fontWeight, space} from '../../../Library/Style/layout';
import {PrefSetupBody, PrefSetupBodyLabel, PrefSetupRow, PrefSetupSlimDraggableHeader, PrefSetupSpace} from './PrefSetupCommon';
import {TextInput} from '../../../Library/View/TextInput';
import {CheckBox} from '../../../Library/View/CheckBox';
import {Link} from '../../../Library/View/Link';
import {View} from '../../../Library/View/View';
import {appTheme} from '../../../Library/Style/appTheme';
import {Text} from '../../../Library/View/Text';
import {DocsUtil} from '../../../Library/Util/DocsUtil';
import styled from 'styled-components';
import {UserPrefIPC} from '../../../../IPC/UserPrefIPC';
import {shell} from 'electron';
import {MainWindowIPC} from '../../../../IPC/MainWindowIPC';

type Props = {
  visible: boolean;
  githubType: 'github' | 'ghe';
  host: string;
  https: boolean;
  showImportData: boolean;
  onSelectGitHubCom: () => void;
  onSelectGHE: () => void;
  onChangeGHEHost: (host: string) => void;
  onChangeHTTPS: (enable: boolean) => void;
  onFinishGHE: () => void;
};

type State = {
  showImportDataDesc: boolean;
};

export class PrefSetupGitHubHost extends React.Component<Props, State> {
  state: State = {
    showImportDataDesc: false,
  }

  private async handleOpenDataDir() {
    const {userPrefPath} = await UserPrefIPC.getEachPaths();
    shell.showItemInFolder(userPrefPath);
  }

  private handleRestart() {
    MainWindowIPC.reload();
  }

  render() {
    return (
      <PrefSetupBody style={{display: this.props.visible ? undefined : 'none'}}>
        <PrefSetupSlimDraggableHeader/>
        <PrefSetupRow>
          <Button onClick={this.props.onSelectGitHubCom} style={{width: 160, marginRight: space.medium}}>GitHub (github.com)</Button>
          Use standard GitHub (github.com).
        </PrefSetupRow>
        <PrefSetupSpace/>

        <PrefSetupRow>
          <Button onClick={this.props.onSelectGHE} style={{width: 160, marginRight: space.medium}}>GitHub Enterprise</Button>
          Use GitHub Enterprise.
        </PrefSetupRow>
        <PrefSetupSpace/>

        {this.renderGHE()}
        {this.renderImportData()}
      </PrefSetupBody>
    );
  }

  renderGHE() {
    if (this.props.githubType !== 'ghe') return;

    return (
      <React.Fragment>
        <PrefSetupBodyLabel>Please enter your GitHub Enterprise host.</PrefSetupBodyLabel>
        <TextInput value={this.props.host} onChange={this.props.onChangeGHEHost} placeholder='ghe.example.com'/>
        <PrefSetupSpace/>

        <PrefSetupRow>
          <CheckBox checked={this.props.https} onChange={this.props.onChangeHTTPS}/>
          <PrefSetupBodyLabel style={{paddingLeft: space.medium}}>Use HTTPS</PrefSetupBodyLabel>
        </PrefSetupRow>
        <PrefSetupSpace/>
        <PrefSetupSpace/>

        <Button onClick={this.props.onFinishGHE}>OK</Button>
      </React.Fragment>
    );
  }

  renderImportData() {
    if (!this.props.showImportData) return;

    let descView;
    if (this.state.showImportDataDesc) {
      descView = (
        <ImportDescRoot>
          <ImportDesc>1. Export existing all data from <ImportDescHighlight>Menu → Jasper → Export Data</ImportDescHighlight> of current Jasper.</ImportDesc>
          <ImportDesc>2. <Link onClick={() => this.handleOpenDataDir()}>Open data directory</Link>.</ImportDesc>
          <ImportDesc>3. Copy existing all data to the data directory.</ImportDesc>
          <ImportDesc>4. <Link onClick={() => this.handleRestart()}>Restart Jasper</Link>.</ImportDesc>
        </ImportDescRoot>
      );
    }

    return (
      <React.Fragment>
        <PrefSetupSpace/>
        <View style={{height: border.medium, background: appTheme().border.normal}}/>
        <PrefSetupSpace/>
        <PrefSetupSpace/>
        <PrefSetupRow>
          <Button onClick={() => this.setState({showImportDataDesc: true})} style={{width: 160, marginRight: space.medium}}>Import Data</Button>
          <Text style={{paddingRight: space.medium}}>Import existing Jasper data.</Text>
          <Link url={DocsUtil.getDataMigrationURL()}>Help</Link>
        </PrefSetupRow>
        {descView}
      </React.Fragment>
    );
  }
}

const ImportDescRoot = styled(View)`
  padding: ${space.medium}px 0;
`;

const ImportDesc = styled(Text)`
  padding-bottom: ${space.medium}px;
`;

const ImportDescHighlight = styled(Text)`
  background: ${() => appTheme().bg.primarySoft};
  font-weight: ${fontWeight.bold};
  padding: ${space.tiny}px ${space.small}px;
  display: inline-block;
  border-radius: 4px;
`;
