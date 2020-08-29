import React from 'react';
import {StreamEntity} from '../../../Library/Type/StreamEntity';
import {ColorUtil} from '../../../Library/Util/ColorUtil';
import {Modal} from '../../../Library/View/Modal';
import {Text} from '../../../Library/View/Text';
import {TextInput} from '../../../Library/View/TextInput';
import {Icon} from '../../../Library/View/Icon';
import {space} from '../../../Library/Style/layout';
import {Link} from '../../../Library/View/Link';
import {colorPalette} from '../../../Library/Style/color';
import {View} from '../../../Library/View/View';
import {CheckBox} from '../../../Library/View/CheckBox';
import {Button} from '../../../Library/View/Button';
import styled from 'styled-components';
import {ClickView} from '../../../Library/View/ClickView';
import {StreamRepo} from '../../../Repository/StreamRepo';

type Props = {
  show: boolean;
  onClose: (edited: boolean, streamId?: number, filterStreamId?: number) => void;
  editingUserStream: StreamEntity;
  editingFilterStream: StreamEntity | null;
  initialFilter: string;
}

type State = {
  name: string;
  filter: string;
  color: string;
  notification: boolean;
}

export class FilterStreamEditorFragment extends React.Component<Props, State> {
  state: State = {
    name: '',
    filter: '',
    color: '',
    notification: true,
  }

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    // 表示されたときに初期化する
    if (!prevProps.show && this.props.show) {
      const editingFilterStream = this.props.editingFilterStream;
      if (editingFilterStream) {
        this.setState({
          name: editingFilterStream.name,
          filter: editingFilterStream.userFilter,
          color: editingFilterStream.color,
          notification: !!editingFilterStream.notification,
        });
      } else {
        this.setState({
          name: '',
          filter: this.props.initialFilter || '',
          color: this.props.editingUserStream.color,
          notification: !!this.props.editingUserStream.notification,
        });
      }
    }
  }

  private async handleEdit() {
    const name = this.state.name?.trim();
    const filter = this.state.filter?.trim();
    const color = this.state.color?.trim();
    const notification = this.state.notification ? 1 : 0;

    if (!name) return;
    if (!filter.length) return;
    if (!ColorUtil.isValid(color)) return;

    if (this.props.editingFilterStream) {
      const {error} = await StreamRepo.updateStream(this.props.editingFilterStream.id, name, [], filter, notification, color, this.props.editingUserStream.enabled);
      if (error) return console.error(error);
      this.props.onClose(true, this.props.editingUserStream.id, this.props.editingFilterStream.id);
    } else {
      const {error, stream} = await StreamRepo.createStream(this.props.editingUserStream.id, name, [], filter, notification, color);
      if (error) return console.error(error);
      this.props.onClose(true, this.props.editingUserStream.id, stream.id);
    }
  }

  private async handleCancel() {
    this.props.onClose(false);
  }

  render() {
    return (
      <Modal show={this.props.show} onClose={() => this.handleCancel()} style={{width: 500}}>
        {this.renderParentStream()}
        {this.renderName()}
        {this.renderFilter()}
        {this.renderColor()}
        {this.renderNotification()}
        {this.renderButtons()}
      </Modal>
    );
  }

  private renderParentStream() {
    if (!this.props.editingUserStream) return;

    const queries = this.props.editingUserStream.queries;
    const queryViews = queries.map((query, index) => {
      return <TextInput value={query} onChange={() => null} key={index} readOnly={true} style={{marginBottom: space.small}}/>;
    });

    return (
      <React.Fragment>
        <Text>Stream: {this.props.editingUserStream.name}</Text>
        {queryViews}
      </React.Fragment>
    );
  }

  private renderName() {
    return (
      <React.Fragment>
        <Space/>
        <Text>Name</Text>
        <TextInput value={this.state.name} onChange={t => this.setState({name: t})} placeholder='filter stream name'/>
      </React.Fragment>
    );
  }

  private renderFilter() {
    return (
      <React.Fragment>
        <Space/>
        <Row>
          <Text>Filter</Text>
          <Link url='https://jasperapp.io/doc.html#filter' style={{marginLeft: space.medium}}>help</Link>
        </Row>
        <TextInput
          value={this.state.filter}
          onChange={t => this.setState({filter: t})}
          placeholder='is:pr author:octocat'
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
          <Icon name='filter' color={this.state.color} style={{marginLeft: space.small}}/>
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
  justify-content: flex-end;
`;

const ColorCell = styled(ClickView)`
  width: 16px;
  height: 16px;
  border-radius: 100%;
`;
