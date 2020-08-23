import React from 'react';
import {StreamPolling} from '../../../Repository/Polling/StreamPolling';
import {Modal} from '../../../Library/View/Modal';
import {Text} from '../../../Library/View/Text';
import {TextInput} from '../../../Library/View/TextInput';
import {CheckBox} from '../../../Library/View/CheckBox';
import styled from 'styled-components';
import {View} from '../../../Library/View/View';
import {Button} from '../../../Library/View/Button';
import {font, space} from '../../../Library/Style/layout';
import {appTheme} from '../../../Library/Style/appTheme';
import {StreamEntity} from '../../../Library/Type/StreamEntity';
import {StreamRepo} from '../../../Repository/StreamRepo';

type Props = {
  show: boolean;
  stream: StreamEntity;
  onClose: (edited: boolean, systemStreamId?: number) => void;
}

type State = {
  name: string;
  enabled: boolean;
  notification: boolean;
  queries: string[];
}

export class SystemStreamEditorFragment extends React.Component<Props, State> {
  state: State = {
    name: '',
    enabled: true,
    notification: true,
    queries: [],
  }

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    // 表示されたとき
    if (!prevProps.show && this.props.show) {
      const stream = this.props.stream;
      this.setState({
        name: stream.name,
        enabled: !!stream.enabled,
        notification: !!stream.notification,
        queries: StreamPolling.getStreamQueries(stream.id),
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
    );
    if (error) return console.error(error);

    this.props.onClose(true, this.props.stream.id);
  }

  render() {
    return (
      <Modal show={this.props.show} onClose={this.handleClose.bind(this)} style={{width: 400}}>
        <Text>Name</Text>
        <TextInput value={this.state.name} onChange={() => null} readOnly={true}/>

        <Space/>
        <CheckBox
          checked={this.state.enabled}
          onChange={c => this.setState({enabled: c})}
          label='Enabled'
        />
        <SmallText>If you do not use this stream, we recommend disabling it. This will speed up the update interval for other streams</SmallText>

        <Space/>
        <Space/>
        <CheckBox
          checked={this.state.notification}
          onChange={c => this.setState({notification: c})}
          label='Notification'
        />

        {this.renderQueries()}

        <Space/>
        <Buttons>
          <Button onClick={() => this.handleClose()}>Cancel</Button>
          <Button onClick={() => this.handleUpdate()} type='primary' style={{marginLeft: space.medium}}>OK</Button>
        </Buttons>
      </Modal>
    );
  }

  private renderQueries() {
    if (!this.state.queries.length) return;

    const queryViews = this.state.queries.map((query, index) => {
      return <TextInput value={query} onChange={() => null} readOnly={true} key={index} style={{marginBottom: space.small}}/>;
    });

    return (
      <React.Fragment>
        <Space/>
        <Text>Queries</Text>
        {queryViews}
      </React.Fragment>
    );
  }
}

const Buttons = styled(View)`
  flex-direction: row;
  justify-content: flex-end;
`;

const SmallText = styled(Text)`
  font-size: ${font.small}px;
  color: ${() => appTheme().textSoftColor};
`;

const Space = styled(View)`
  height: ${space.medium}px;
`;
