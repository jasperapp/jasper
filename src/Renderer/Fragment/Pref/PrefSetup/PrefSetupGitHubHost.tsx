import React from 'react';
import styled from 'styled-components';
import {appTheme} from '../../../Library/Style/appTheme';
import {border, fontWeight, space} from '../../../Library/Style/layout';
import {DocsUtil} from '../../../Library/Util/DocsUtil';
import {Button} from '../../../Library/View/Button';
import {CheckBox} from '../../../Library/View/CheckBox';
import {Link} from '../../../Library/View/Link';
import {Text} from '../../../Library/View/Text';
import {TextInput} from '../../../Library/View/TextInput';
import {Translate} from '../../../Library/View/Translate';
import {View} from '../../../Library/View/View';
import {PrefSetupBody, PrefSetupBodyLabel, PrefSetupRow, PrefSetupSlimDraggableHeader, PrefSetupSpace} from './PrefSetupCommon';

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
    const {userPrefPath} = await window.ipc.userPref.getEachPaths();
    window.ipc.electron.shell.showItemInFolder(userPrefPath);
  }

  private handleRestart() {
    window.ipc.mainWindow.reload();
  }

  render() {
    return (
      <PrefSetupBody style={{display: this.props.visible ? undefined : 'none'}}>
        <PrefSetupSlimDraggableHeader/>
        <PrefSetupRow>
          <Button onClick={this.props.onSelectGitHubCom} style={{width: 160, marginRight: space.medium}}>GitHub (github.com)</Button>
          <Translate onMessage={mc => mc.prefSetup.host.github}/>
        </PrefSetupRow>
        <PrefSetupSpace/>

        <PrefSetupRow>
          <Button onClick={this.props.onSelectGHE} style={{width: 160, marginRight: space.medium}}>GitHub Enterprise</Button>
          <Translate onMessage={mc => mc.prefSetup.host.ghe}/>
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
        <PrefSetupBodyLabel><Translate onMessage={mc => mc.prefSetup.host.gheDesc}/></PrefSetupBodyLabel>
        <TextInput value={this.props.host} onChange={this.props.onChangeGHEHost} placeholder='ghe.example.com'/>
        <PrefSetupSpace/>

        <PrefSetupRow>
          <CheckBox checked={this.props.https} onChange={this.props.onChangeHTTPS}/>
          <PrefSetupBodyLabel style={{paddingLeft: space.medium}}><Translate onMessage={mc => mc.prefSetup.host.https}/></PrefSetupBodyLabel>
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
          <ImportDesc>1. <Translate onMessage={mc => mc.prefSetup.host.importData.step1} values={{menu: <ImportDescHighlight>Menu → Jasper → Export Data</ImportDescHighlight>}}/></ImportDesc>
          <ImportDesc>2. <Link onClick={() => this.handleOpenDataDir()}><Translate onMessage={mc => mc.prefSetup.host.importData.step2}/></Link></ImportDesc>
          <ImportDesc>3. <Translate onMessage={mc => mc.prefSetup.host.importData.step3}/></ImportDesc>
          <ImportDesc>4. <Link onClick={() => this.handleRestart()}><Translate onMessage={mc => mc.prefSetup.host.importData.step4}/></Link></ImportDesc>
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
          <Button onClick={() => this.setState({showImportDataDesc: true})} style={{width: 160, marginRight: space.medium}}><Translate onMessage={mc => mc.prefSetup.host.importData.button}/></Button>
          <Text style={{paddingRight: space.medium}}><Translate onMessage={mc => mc.prefSetup.host.importData.buttonDesc}/></Text>
          <Link url={DocsUtil.getDataMigrationURL()}><Translate onMessage={mc => mc.prefSetup.host.importData.help}/></Link>
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
