import React from 'react';
import {UserPrefRepo} from '../../../Repository/UserPrefRepo';
import {StreamEntity} from '../../../Library/Type/StreamEntity';
import {appTheme} from '../../../Library/Style/appTheme';
import {Modal} from '../../../Library/View/Modal';
import {TextInput} from '../../../Library/View/TextInput';
import {Text} from '../../../Library/View/Text';
import styled from 'styled-components';
import {View} from '../../../Library/View/View';
import {font, space} from '../../../Library/Style/layout';
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
import {ShellUtil} from '../../../Library/Util/ShellUtil';
import {ScrollView} from '../../../Library/View/ScrollView';
import {DocsUtil} from '../../../Library/Util/DocsUtil';
import {Translate} from '../../../Library/View/Translate';

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
  showDetail: boolean;
  errorName: boolean;
  errorQuery: boolean;
  errorColor: boolean,
  errorIconName: boolean;
  warningIsOpen: boolean;
}

export class StreamEditorFragment extends React.Component<Props, State> {
  state: State = {
    name: '',
    queries: [],
    color: '',
    notification: true,
    iconName: 'github',
    showDetail: false,
    errorName: false,
    errorQuery: false,
    errorColor: false,
    errorIconName: false,
    warningIsOpen: false,
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
          showDetail: false,
          errorName: false,
          errorQuery: false,
          errorColor: false,
          errorIconName: false,
          warningIsOpen: false,
        });
      } else {
        this.setState({
          name: '',
          queries: [''],
          color: appTheme().icon.normal,
          notification: true,
          iconName: 'github',
          showDetail: false,
          errorName: false,
          errorQuery: false,
          errorColor: false,
          errorIconName: false,
          warningIsOpen: false,
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

    this.setState({errorName: false, errorQuery: false, errorColor: false, errorIconName: false});
    if (!name) return this.setState({errorName: true});
    if (!queries.length) return this.setState({errorQuery: true});
    if (!ColorUtil.isValid(color)) return this.setState({errorColor: true});
    if (!iconName) return this.setState({errorIconName: true});

    if (this.props.editingStream) {
      const {error} = await StreamRepo.updateStream(this.props.editingStream.id, name, queries, [], notification, color, this.props.editingStream.enabled, iconName);
      if (error) return console.error(error);
      this.props.onClose(true, this.props.editingStream.id);
    } else {
      const {error, stream} = await StreamRepo.createStream('UserStream', null, name, queries, [], notification, color, iconName);
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
    const isQueryError = !queries.some(query => query.trim());
    const warningIsOpen = queries.some(query => query.split(' ').includes('is:open'));
    this.setState({queries, errorQuery: isQueryError, warningIsOpen});
  }

  render() {
    return (
      <Modal show={this.props.show} onClose={() => this.handleCancel()} style={{width: 500}} fixedTopPosition={true}>
        {this.renderName()}
        {this.renderQueries()}
        {this.renderDetails()}
        {this.renderButtons()}
      </Modal>
    );
  }

  private renderName() {
    return (
      <React.Fragment>
        <Translate onMessage={mc => mc.userStreamEditor.name}/>
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
          hasError={this.state.errorQuery}
        />
      );
    });

    let warningView;
    if (this.state.warningIsOpen) {
      warningView = (
        <Warning>
          <Translate
            onMessage={mc => mc.userStreamEditor.warning}
            values={{
              isOpen: <IsOpenQuery>is:open</IsOpenQuery>,
              link: <Link url={DocsUtil.getOpenIssueURL()}>{DocsUtil.getOpenIssueURL()}</Link>,
            }}
          />
        </Warning>
      );
    }

    return (
      <React.Fragment>
        <Space/>
        <Row>
          <Translate onMessage={mc => mc.userStreamEditor.query}/>
          <Link style={{marginLeft: space.medium}} onClick={() => this.handlePreview()}><Translate onMessage={mc => mc.userStreamEditor.preview}/></Link>
          <Link url={DocsUtil.getStreamURL()} style={{marginLeft: space.medium}}><Translate onMessage={mc => mc.userStreamEditor.help}/></Link>
          <View style={{flex: 1}}/>
          <AddQuery onClick={() => this.handleAddQueryRow()}>
            <Icon name='plus'/>
            <Translate onMessage={mc => mc.userStreamEditor.addQuery}/>
          </AddQuery>
        </Row>
        <QueriesScrollView>
          {queryViews}
        </QueriesScrollView>
        {warningView}
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
        <Row>
          <Translate onMessage={mc => mc.userStreamEditor.color}/>
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
          <Translate onMessage={mc => mc.userStreamEditor.icon}/>
          <Icon name={this.state.iconName} color={this.state.color} style={{marginLeft: space.small}}/>
          <View style={{flex: 1}}/>
          {iconNameViews}
          <Link url='https://materialdesignicons.com/' style={{marginLeft: space.small}}><Translate onMessage={mc => mc.userStreamEditor.allIcons}/></Link>
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
          label={<Translate onMessage={mc => mc.userStreamEditor.notification}/>}
        />
      </React.Fragment>
    );
  }

  private renderButtons() {
    return (
      <React.Fragment>
        <Space/>
        <Buttons>
          <Button onClick={() => this.setState({showDetail: !this.state.showDetail})}><Translate onMessage={mc => mc.userStreamEditor.showDetail}/></Button>
          <View style={{flex: 1}}/>
          <Button onClick={() => this.handleCancel()}><Translate onMessage={mc => mc.userStreamEditor.cancel}/></Button>
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

const AddQuery = styled(ClickView)`
  flex-direction: row;
  align-items: center;
`;

const QueriesScrollView = styled(ScrollView)`
  max-height: 150px;
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

const Warning = styled(Text)`
  font-size: ${font.small}px;
`;

const IsOpenQuery = styled(Text)`
  font-size: ${font.small}px;
  background: ${() => appTheme().bg.primarySoft};
  padding: ${space.tiny}px ${space.small}px;
  border-radius: 4px;
`;

const Details = styled(View)`
  padding: ${space.medium}px 0;
`;
