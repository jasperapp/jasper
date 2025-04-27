import React from 'react';
import styled from 'styled-components';
import {GitHubV4ProjectNextClient} from '../../../Library/GitHub/V4/GitHubV4ProjectNextClient';
import {appTheme} from '../../../Library/Style/appTheme';
import {colorPalette} from '../../../Library/Style/color';
import {space} from '../../../Library/Style/layout';
import {IconNameType} from '../../../Library/Type/IconNameType';
import {StreamEntity} from '../../../Library/Type/StreamEntity';
import {ColorUtil} from '../../../Library/Util/ColorUtil';
import {DocsUtil} from '../../../Library/Util/DocsUtil';
import {GitHubUtil} from '../../../Library/Util/GitHubUtil';
import {ShellUtil} from '../../../Library/Util/ShellUtil';
import {Button} from '../../../Library/View/Button';
import {CheckBox} from '../../../Library/View/CheckBox';
import {ClickView} from '../../../Library/View/ClickView';
import {Icon} from '../../../Library/View/Icon';
import {Link} from '../../../Library/View/Link';
import {Modal} from '../../../Library/View/Modal';
import {Select} from '../../../Library/View/Select';
import {TextInput} from '../../../Library/View/TextInput';
import {mc, Translate} from '../../../Library/View/Translate';
import {View} from '../../../Library/View/View';
import {IssueRepo} from '../../../Repository/IssueRepo';
import {StreamRepo} from '../../../Repository/StreamRepo';
import {UserPrefRepo} from '../../../Repository/UserPrefRepo';
import {SampleIconNames} from '../SampleIconNames';

type Props = {
  show: boolean;
  onClose: (edited: boolean, streamId?: number) => void;
  editingStream: StreamEntity;
}

type State = {
  name: string;
  projectUrl: string;
  color: string;
  notification: boolean;
  iconName: IconNameType;
  showDetail: boolean;
  selectedProjectSuggestion: {url: string; title: string} | null;
  projectSuggestions: {url: string; title: string}[];
  errorName: boolean;
  errorProjectUrl: boolean;
  errorColor: boolean,
  errorIconName: boolean;
}

export class ProjectStreamEditorFragment extends React.Component<Props, State> {
  state: State = {
    name: '',
    projectUrl: '',
    color: '',
    notification: true,
    iconName: 'rocket-launch-outline',
    showDetail: false,
    selectedProjectSuggestion: null,
    projectSuggestions: [],
    errorName: false,
    errorProjectUrl: false,
    errorColor: false,
    errorIconName: false,
  };

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    // 表示されたときに初期化する
    if (!prevProps.show && this.props.show) {
      const editingStream = this.props.editingStream;
      if (editingStream) {
        this.setState({
          name: editingStream.name,
          projectUrl: editingStream.queries[0],
          color: editingStream.color || appTheme().icon.normal,
          notification: !!editingStream.notification,
          iconName: editingStream.iconName,
          showDetail: false,
          selectedProjectSuggestion: null,
          errorName: false,
          errorProjectUrl: false,
          errorColor: false,
          errorIconName: false,
        });
      } else {
        this.setState({
          name: '',
          projectUrl: '',
          color: appTheme().icon.normal,
          notification: true,
          iconName: 'rocket-launch-outline',
          showDetail: false,
          selectedProjectSuggestion: null,
          errorName: false,
          errorProjectUrl: false,
          errorColor: false,
          errorIconName: false,
        });
      }
      this.setProjectSuggestions();
    }
  }

  // ローカルのissueからproject情報を集める。
  private async setProjectSuggestions() {
    const {error, issues} = await IssueRepo.getProjectIssues(1000);
    if (error) return console.error(error);

    const projectMap: {[url: string]: {url: string; title: string}} = {};
    issues.forEach(issue => {
      issue.value.projectFields.forEach(projectField => {
        projectMap[projectField.projectUrl] = {url: projectField.projectUrl, title: projectField.projectTitle};
      });
    });

    const projectSuggestions = Object.values(projectMap);
    this.setState({projectSuggestions});
  }

  // projectに関連するfilter streamを自動的に作成する。
  // - iterationフィールドに基づいたフィルター
  // - statusフィールドに基づいたフィルター
  private async createFilterStream(projectStream: StreamEntity) {
    // create client
    const github = UserPrefRepo.getPref().github;
    const gheVersion = UserPrefRepo.getGHEVersion();
    const client = new GitHubV4ProjectNextClient(github.accessToken, github.host, github.https, gheVersion);

    // get iterationName and statusName
    const projectUrl = projectStream.queries[0];
    const {error, iterationName, statusNames} = await client.getProjectStatusFieldNames(projectUrl);
    if (error != null) {
      console.error(error);
      return;
    }

    // create iteration filter
    if (iterationName != null) {
      const {error} = await StreamRepo.createStream('FilterStream', projectStream.id, `Current ${iterationName}`, [], [`project-field:"${iterationName}/@current_iteration"`], projectStream.notification, projectStream.color);
      if (error != null) {
        console.error(error);
        return;
      }
    }

    // create status filter
    for (const statusName of statusNames) {
      const {error} = await StreamRepo.createStream('FilterStream', projectStream.id, statusName, [], [`project-field:"status/${statusName}"`], projectStream.notification, projectStream.color);
      if (error != null) {
        console.error(error);
        return;
      }
    }
  }

  private async handleEdit() {
    const name = this.state.name?.trim();
    const projectUrl = this.state.projectUrl.trim().replace(/\/views\/\d+$/, ''); // beta projectの場合、URL末尾に/view/1のようにつくことがある。正規化のためにこれを削除しておく。
    const color = this.state.color?.trim();
    const notification = this.state.notification ? 1 : 0;
    const iconName = this.state.iconName?.trim() as IconNameType;

    this.setState({errorName: false, errorProjectUrl: false, errorColor: false, errorIconName: false});
    if (!name) return this.setState({errorName: true});
    if (!projectUrl) return this.setState({errorProjectUrl: true});
    if (!ColorUtil.isValid(color)) return this.setState({errorColor: true});
    if (!iconName) return this.setState({errorIconName: true});

    const webHost = UserPrefRepo.getPref().github.webHost;
    if (!GitHubUtil.isProjectUrl(webHost, projectUrl)) return;

    if (this.props.editingStream) {
      const {error} = await StreamRepo.updateStream(this.props.editingStream.id, name, [projectUrl], [], notification, color, this.props.editingStream.enabled, iconName);
      if (error) return console.error(error);
      this.props.onClose(true, this.props.editingStream.id);
    } else {
      const {error, stream} = await StreamRepo.createStream('ProjectStream', null, name, [projectUrl], [], notification, color, iconName);
      if (error) return console.error(error);
      await this.createFilterStream(stream);
      this.props.onClose(true, stream.id);
    }
  }

  private async handleCancel() {
    this.props.onClose(false);
  }

  private handlePreview() {
    ShellUtil.openExternal(this.state.projectUrl);
  }

  private handleSelectProjectSuggestion(url: string, title: string) {
    if (url == null || url.length === 0) {
      this.setState({selectedProjectSuggestion: null, name: '', projectUrl: ''});
    } else {
      this.setState({selectedProjectSuggestion: {url, title}, name: title, projectUrl: url});
    }
  }

  render() {
    return (
      <Modal show={this.props.show} onClose={() => this.handleCancel()} style={{width: 500}} fixedTopPosition={true}>
        {this.renderProjectSuggestions()}
        {this.renderName()}
        {this.renderProjectUrl()}
        {this.renderDetails()}
        {this.renderButtons()}
      </Modal>
    );
  }

  private renderProjectSuggestions() {
    if (this.state.projectSuggestions.length === 0) return null;

    const items = this.state.projectSuggestions.map(p => ({label: p.title, value: p.url}));
    items.unshift({label: mc().projectStreamEditor.manual, value: ''});

    const selectedValue = this.state.selectedProjectSuggestion?.url ?? items[0].value;

    return (
      <React.Fragment>
        <Translate onMessage={mc => mc.projectStreamEditor.suggestion}/>
        <Select items={items} onSelect={(value, label) => this.handleSelectProjectSuggestion(value, label)} value={selectedValue}/>
        <Space/>
      </React.Fragment>
    );
  }

  private renderName() {
    return (
      <React.Fragment>
        <Translate onMessage={mc => mc.projectStreamEditor.name}/>
        <TextInput
          value={this.state.name}
          onChange={t => this.setState({name: t, errorName: !t})}
          placeholder='stream name'
          autoFocus={true}
          hasError={this.state.errorName}
        />
      </React.Fragment>
    );
  }

  private renderProjectUrl() {
    return (
      <React.Fragment>
        <Space/>
        <Row>
          <Translate onMessage={mc => mc.projectStreamEditor.url}/>
          <Link style={{marginLeft: space.medium}} onClick={() => this.handlePreview()}><Translate onMessage={mc => mc.projectStreamEditor.preview}/></Link>
          <Link url={DocsUtil.getProjectStreamURL()} style={{marginLeft: space.medium}}><Translate onMessage={mc => mc.projectStreamEditor.help}/></Link>
        </Row>
        <TextInput
          value={this.state.projectUrl}
          onChange={t => this.setState({projectUrl: t, errorProjectUrl: !t})}
          placeholder={`https://${UserPrefRepo.getPref().github.webHost}/jasperapp/jasper/projects/1`}
          style={{marginBottom: space.small}}
          hasError={this.state.errorProjectUrl}
        />
      </React.Fragment>
    );
  }

  private renderDetails() {
    if (!this.state.showDetail) return;

    return (
      <Details>
        {this.renderColor()}
        {this.renderIcon()}
        {this.renderNotification()}
      </Details>
    );
  }

  private renderColor() {
    const colorViews = colorPalette.map((color, index) => {
      return (
        <ColorCell
          key={index}
          style={{background: color, marginLeft: space.small}}
          onClick={() => this.setState({color})}
        />
      );
    });

    return (
      <React.Fragment>
        <Space/>
        <Row>
          <Translate onMessage={mc => mc.projectStreamEditor.color}/>
          <View style={{flex: 1}}/>
          {colorViews}
        </Row>
        <TextInput value={this.state.color} onChange={t => this.setState({color: t})} hasError={this.state.errorColor}/>
      </React.Fragment>
    );
  }

  private renderIcon() {
    const iconNameViews = SampleIconNames.map(iconName => {
      return (
        <IconClickView key={iconName} onClick={() => this.setState({iconName})}>
          <Icon name={iconName} color={this.state.color}/>
        </IconClickView>
      );
    });

    return (
      <React.Fragment>
        <Space/>
        <Row>
          <Translate onMessage={mc => mc.projectStreamEditor.icon}/>
          <Icon name={this.state.iconName} color={this.state.color} style={{marginLeft: space.small}}/>
          <View style={{flex: 1}}/>
          {iconNameViews}
          <Link url='https://materialdesignicons.com/' style={{marginLeft: space.small}}><Translate onMessage={mc => mc.projectStreamEditor.allIcons}/></Link>
        </Row>
        <TextInput value={this.state.iconName} onChange={t => this.setState({iconName: t as IconNameType})} hasError={this.state.errorIconName}/>
      </React.Fragment>
    );
  }

  private renderNotification() {
    return (
      <React.Fragment>
        <Space/>
        <CheckBox
          checked={this.state.notification}
          onChange={c => this.setState({notification: c})}
          label={<Translate onMessage={mc => mc.projectStreamEditor.notification}/>}
        />
      </React.Fragment>
    );
  }

  private renderButtons() {
    return (
      <React.Fragment>
        <Space/>
        <Buttons>
          <Button onClick={() => this.setState({showDetail: !this.state.showDetail})}><Translate onMessage={mc => mc.projectStreamEditor.showDetail}/></Button>
          <View style={{flex: 1}}/>
          <Button onClick={() => this.handleCancel()}><Translate onMessage={mc => mc.projectStreamEditor.cancel}/></Button>
          <Button onClick={() => this.handleEdit()} type='primary' style={{marginLeft: space.medium}}>OK</Button>
        </Buttons>
      </React.Fragment>
    );
  }
}

const Space = styled(View)`
  height: ${space.large}px;
`;

const Row = styled(View)`
  flex-direction: row;
  align-items: center;
`;

const Buttons = styled(View)`
  flex-direction: row;
  align-items: center;
`;

const ColorCell = styled(ClickView)`
  width: 16px;
  height: 16px;
  border-radius: 100%;
`;

const IconClickView = styled(ClickView)`
  margin-left: ${space.small}px;
`;

const Details = styled(View)`
  padding: ${space.medium}px 0;
`;
