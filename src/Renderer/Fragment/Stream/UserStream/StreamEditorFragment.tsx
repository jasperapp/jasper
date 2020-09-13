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
import {Link} from '../../../Library/View/Link';
import {ClickView} from '../../../Library/View/ClickView';
import {Icon} from '../../../Library/View/Icon';
import {CheckBox} from '../../../Library/View/CheckBox';
import {Button} from '../../../Library/View/Button';
import {ColorUtil} from '../../../Library/Util/ColorUtil';
import {colorPalette} from '../../../Library/Style/color';
import {StreamRepo} from '../../../Repository/StreamRepo';
import {IconNameType} from '../../../Library/Type/IconNameType';
import {SampleIconNames} from '../SampleIconNames';
import {ShellUtil} from '../../../../Util/ShellUtil';

type Props = {
  show: boolean;
  onClose: (edited: boolean, streamId?: number) => void;
  editingStream: StreamEntity;
}

type State = {
  name: string;
  queries: string[];
  color: string;
  notification: boolean;
  iconName: IconNameType;
}

export class StreamEditorFragment extends React.Component<Props, State> {
  state: State = {
    name: '',
    queries: [],
    color: '',
    notification: true,
    iconName: 'github',
  }

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    // 表示されたときに初期化する
    if (!prevProps.show && this.props.show) {
      const editingStream = this.props.editingStream;
      if (editingStream) {
        this.setState({
          name: editingStream.name,
          queries: editingStream.queries,
          color: editingStream.color || appTheme().icon.normal,
          notification: !!editingStream.notification,
          iconName: editingStream.iconName,
        });
      } else {
        this.setState({
          name: '',
          queries: [''],
          color: appTheme().icon.normal,
          notification: true,
          iconName: 'github',
        });
      }
    }
  }

  private async handleEdit() {
    const name = this.state.name?.trim();
    const queries = this.state.queries.filter(q => q.trim());
    const color = this.state.color?.trim();
    const notification = this.state.notification ? 1 : 0;
    const iconName = this.state.iconName?.trim() as IconNameType;

    if (!name) return;
    if (!queries.length) return;
    if (!ColorUtil.isValid(color)) return;
    if (!iconName) return;

    if (this.props.editingStream) {
      const {error} = await StreamRepo.updateStream(this.props.editingStream.id, name, queries, '', notification, color, this.props.editingStream.enabled, iconName);
      if (error) return console.error(error);
      this.props.onClose(true, this.props.editingStream.id);
    } else {
      const {error, stream} = await StreamRepo.createStream('UserStream', null, name, queries, '', notification, color, iconName);
      if (error) return console.error(error);
      this.props.onClose(true, stream.id);
    }
  }

  private async handleCancel() {
    this.props.onClose(false);
  }

  private handlePreview() {
    const webHost = UserPrefRepo.getPref().github.webHost;
    this.state.queries.map(query => {
      const url = `https://${webHost}/search?s=updated&o=desc&type=Issues&q=${encodeURIComponent(query)}`;
      ShellUtil.openExternal(url);
    });
  }

  private handleAddQueryRow() {
    const queries = [...this.state.queries, ''];
    this.setState({queries});
  }

  private handleDeleteQueryRow(deleteIndex: number) {
    if (this.state.queries.length <= 1) return;

    const queries = this.state.queries.filter((_, index) => index !== deleteIndex);
    this.setState({queries});
  }

  private handleSetQuery(query: string, index: number) {
    const queries = [...this.state.queries];
    queries[index] = query;
    this.setState({queries});
  }

  render() {
    return (
      <Modal show={this.props.show} onClose={() => this.handleCancel()} style={{width: 500}}>
        {this.renderName()}
        {this.renderQueries()}
        {this.renderColor()}
        {this.renderIcon()}
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

  private renderQueries() {
    const queryViews = this.state.queries.map((query, index) => {
      return (
        <TextInput
          key={index}
          value={query}
          onChange={t => this.handleSetQuery(t, index)}
          placeholder='is:pr author:octocat'
          style={{marginBottom: space.small}}
          showClearButton={this.state.queries.length > 1 ? 'always' : null}
          onClear={() => this.handleDeleteQueryRow(index)}
        />
      );
    });

    return (
      <React.Fragment>
        <Space/>
        <Row>
          <Text>Queries</Text>
          <Link url='https://jasperapp.io/doc.html#stream' style={{marginLeft: space.medium}}>help</Link>
        </Row>
        {queryViews}
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
          <View style={{flex: 1}}/>
          {colorViews}
        </Row>
        <TextInput value={this.state.color} onChange={t => this.setState({color: t})}/>
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
          <Text>Icon</Text>
          <Icon name={this.state.iconName} color={this.state.color} style={{marginLeft: space.small}}/>
          <View style={{flex: 1}}/>
          {iconNameViews}
          <Link url='https://materialdesignicons.com/' style={{marginLeft: space.small}}>All Icons</Link>
        </Row>
        <TextInput value={this.state.iconName} onChange={t => this.setState({iconName: t as IconNameType})}/>
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
          <Button onClick={() => this.handleAddQueryRow()} style={{marginLeft: space.medium}}>Add Query</Button>
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

const IconClickView = styled(ClickView)`
  margin-left: ${space.small}px;
`;
