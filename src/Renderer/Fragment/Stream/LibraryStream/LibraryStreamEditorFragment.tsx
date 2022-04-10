import React from 'react';
import {Modal} from '../../../Library/View/Modal';
import {TextInput} from '../../../Library/View/TextInput';
import {CheckBox} from '../../../Library/View/CheckBox';
import styled from 'styled-components';
import {View} from '../../../Library/View/View';
import {Button} from '../../../Library/View/Button';
import {space} from '../../../Library/Style/layout';
import {StreamEntity} from '../../../Library/Type/StreamEntity';
import {StreamRepo} from '../../../Repository/StreamRepo';
import {ScrollView} from '../../../Library/View/ScrollView';
import {Translate} from '../../../Library/View/Translate';

type Props = {
  show: boolean;
  stream: StreamEntity;
  onClose: (edited: boolean, systemStreamId?: number) => void;
}

type State = {
  name: string;
  enabled: boolean;
  notification: boolean;
  filter: string;
}

export class LibraryStreamEditorFragment extends React.Component<Props, State> {
  state: State = {
    name: '',
    enabled: true,
    notification: true,
    filter: '',
  }

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    // 表示されたとき
    if (!prevProps.show && this.props.show) {
      const stream = this.props.stream;
      this.setState({
        name: stream.name,
        enabled: !!stream.enabled,
        notification: !!stream.notification,
        filter: stream.defaultFilter,
      });
    }
  }

  private handleClose() {
    this.props.onClose(false);
  }

  private async handleUpdate() {
    const enabled = this.state.enabled ? 1 : 0;
    const notification = this.state.notification ? 1 : 0;

    // 何も編集されていない場合、即return
    if (this.props.stream.enabled === enabled && this.props.stream.notification === notification) {
      this.props.onClose(false);
      return;
    }

    const {error} = await StreamRepo.updateStream(
      this.props.stream.id,
      this.props.stream.name,
      [],
      '',
      notification,
      this.props.stream.color,
      enabled,
      this.props.stream.iconName,
    );
    if (error) return console.error(error);

    this.props.onClose(true, this.props.stream.id);
  }

  render() {
    return (
      <Modal show={this.props.show} onClose={this.handleClose.bind(this)} style={{width: 400}}>
        <Translate onMessage={mc => mc.libraryStreamEditor.name}/>
        <TextInput value={this.state.name} onChange={() => null} readOnly={true}/>

        <Space/>
        <CheckBox
          checked={this.state.enabled}
          onChange={c => this.setState({enabled: c})}
          label={<Translate onMessage={mc => mc.libraryStreamEditor.enable}/>}
        />

        <Space/>
        <Space/>
        <CheckBox
          checked={this.state.notification}
          onChange={c => this.setState({notification: c})}
          label={<Translate onMessage={mc => mc.libraryStreamEditor.notification}/>}
        />

        {this.renderFilter()}

        <Space/>
        <Buttons>
          <Button onClick={() => this.handleClose()}><Translate onMessage={mc => mc.libraryStreamEditor.cancel}/></Button>
          <Button onClick={() => this.handleUpdate()} type='primary' style={{marginLeft: space.medium}}>OK</Button>
        </Buttons>
      </Modal>
    );
  }

  private renderFilter() {
    return (
      <React.Fragment>
        <Space/>
        <Translate onMessage={mc => mc.libraryStreamEditor.filter}/>
        <QueriesScrollView>
          <TextInput value={this.state.filter} onChange={() => null} readOnly={true}/>
        </QueriesScrollView>
      </React.Fragment>
    );
  }
}

const Buttons = styled(View)`
  flex-direction: row;
  justify-content: flex-end;
`;

const Space = styled(View)`
  height: ${space.medium}px;
`;

const QueriesScrollView = styled(ScrollView)`
  max-height: 300px;
`;
