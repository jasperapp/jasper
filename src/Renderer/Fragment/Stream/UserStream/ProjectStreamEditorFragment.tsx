import React from 'react';
import {UserPrefRepo} from '../../../Repository/UserPrefRepo';
import {StreamEntity} from '../../../Library/Type/StreamEntity';
import {appTheme} from '../../../Library/Style/appTheme';
import {Modal} from '../../../Library/View/Modal';
import {TextInput} from '../../../Library/View/TextInput';
import {Text} from '../../../Library/View/Text';
import styled from 'styled-components';
import {View} from '../../../Library/View/View';
import {space} from '../../../Library/Style/layout';
import {ClickView} from '../../../Library/View/ClickView';
import {Icon} from '../../../Library/View/Icon';
import {CheckBox} from '../../../Library/View/CheckBox';
import {Button} from '../../../Library/View/Button';
import {ColorUtil} from '../../../Library/Util/ColorUtil';
import {colorPalette} from '../../../Library/Style/color';
import {shell} from 'electron';
import {StreamRepo} from '../../../Repository/StreamRepo';
import {GitHubUtil} from '../../../Library/Util/GitHubUtil';

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
}

export class ProjectStreamEditorFragment extends React.Component<Props, State> {
  state: State = {
    name: '',
    projectUrl: '',
    color: '',
    notification: true,
  }

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    // 表示されたときに初期化する
    if (!prevProps.show && this.props.show) {
      const editingStream = this.props.editingStream;
      if (editingStream) {
        this.setState({
          name: editingStream.name,
          projectUrl: editingStream.queries[0],
          color: editingStream.color || appTheme().iconColor,
          notification: !!editingStream.notification,
        });
      } else {
        this.setState({
          name: '',
          projectUrl: '',
          color: appTheme().iconColor,
          notification: true,
        });
      }
    }
  }

  private async handleEdit() {
    const name = this.state.name?.trim();
    const projectUrl = this.state.projectUrl.trim();
    const color = this.state.color?.trim();
    const notification = this.state.notification ? 1 : 0;

    if (!name) return;
    if (!projectUrl) return;
    if (!ColorUtil.isValid(color)) return;

    const webHost = UserPrefRepo.getPref().github.webHost;
    if (!GitHubUtil.isProjectUrl(webHost, projectUrl)) return;

    if (this.props.editingStream) {
      const {error} = await StreamRepo.updateStream(this.props.editingStream.id, name, [projectUrl], '', notification, color, this.props.editingStream.enabled);
      if (error) return console.error(error);
      this.props.onClose(true, this.props.editingStream.id);
    } else {
      const {error, stream} = await StreamRepo.createStream('ProjectStream', null, name, [projectUrl], '', notification, color);
      if (error) return console.error(error);
      this.props.onClose(true, stream.id);
    }
  }

  private async handleCancel() {
    this.props.onClose(false);
  }

  private handlePreview() {
    shell.openExternal(this.state.projectUrl);
  }

  render() {
    return (
      <Modal show={this.props.show} onClose={() => this.handleCancel()} style={{width: 500}}>
        {this.renderName()}
        {this.renderProjectUrl()}
        {this.renderColor()}
        {this.renderNotification()}
        {this.renderButtons()}
      </Modal>
    );
  }

  private renderName() {
    return (
      <React.Fragment>
        <Text>Name</Text>
        <TextInput value={this.state.name} onChange={t => this.setState({name: t})} placeholder='stream name' autoFocus={true}/>
      </React.Fragment>
    );
  }

  private renderProjectUrl() {
    return (
      <React.Fragment>
        <Space/>
        <Row>
          <Text>Project URL</Text>
        </Row>
        <TextInput
          value={this.state.projectUrl}
          onChange={t => this.setState({projectUrl: t})}
          placeholder={`https://${UserPrefRepo.getPref().github.webHost}/jasperapp/jasper/projects/1`}
          style={{marginBottom: space.small}}
        />
      </React.Fragment>
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
          <Text>Color</Text>
          <Icon name='github' color={this.state.color} style={{marginLeft: space.small}}/>
          <View style={{flex: 1}}/>
          {colorViews}
        </Row>
        <TextInput value={this.state.color} onChange={t => this.setState({color: t})}/>
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
          label='Notification'
        />
      </React.Fragment>
    );
  }

  private renderButtons() {
    return (
      <React.Fragment>
        <Space/>
        <Buttons>
          <Button onClick={() => this.handlePreview()}>Preview</Button>
          <View style={{flex: 1}}/>
          <Button onClick={() => this.handleCancel()}>Cancel</Button>
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
