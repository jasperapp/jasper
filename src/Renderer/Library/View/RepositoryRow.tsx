import React, {CSSProperties} from 'react';
import {RepositoryEntity} from '../Type/RepositoryEntity';
import {Icon} from './Icon';
import {color} from '../Style/color';
import {appTheme} from '../Style/appTheme';
import styled from 'styled-components';
import {ClickView} from './ClickView';
import {space} from '../Style/layout';
import {Text} from './Text';
import ReactDOM from 'react-dom';

type Props = {
  repository: RepositoryEntity;
  selected: boolean;
  className?: string;
  style?: CSSProperties;
}

type State = {
}

export class RepositoryRow extends React.Component<Props, State> {
  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    // 選択されたときには強制的に表示領域に入るようにする
    if (!prevProps.selected && this.props.selected) {
      const el = ReactDOM.findDOMNode(this) as HTMLDivElement;
      // @ts-ignore
      el.scrollIntoViewIfNeeded(false);
    }
  }

  render() {
    const selectedClassName = this.props.selected ? 'repository-row-selected' : '';
    const iconColor = this.props.selected ? color.white : appTheme().icon.normal;
    return (
      <Root className={`${selectedClassName} ${this.props.style}`} style={this.props.style}>
        <Icon name='open-in-new' color={iconColor}/>
        <RepositoryText>{this.props.repository.fullName}</RepositoryText>
      </Root>
    );
  }
}

const Root = styled(ClickView)`
  flex-direction: row;
  align-items: center;
  border-radius: 8px;
  padding: ${space.small2}px ${space.medium}px;
  margin: 0 ${space.medium}px;
  
  &:hover {
    background: ${() => appTheme().bg.primaryHover};
  }
  
  &.repository-row-selected {
    background: ${() => appTheme().accent.normal};
    color: ${color.white};
  }
`;

const RepositoryText = styled(Text)`
  padding-left: ${space.medium}px;
  flex: 1;
  .repository-row-selected & {
    color: ${color.white};
  }
`;
