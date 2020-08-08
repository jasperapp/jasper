import React, {ChangeEvent, CSSProperties, KeyboardEvent} from 'react';
import styled from 'styled-components';
import {space} from '../Style/layout';

type Props = {
  value: string;
  onChange(ev: ChangeEvent<HTMLInputElement>);
  placeholder?: string;
  style?: CSSProperties;
  onEnter?: () => void;
}

type State = {
}

export class TextInput extends React.Component<Props, State> {
  private handleKeyDown(ev: KeyboardEvent<HTMLInputElement>) {
    if (ev.key === 'Enter' && this.props.onEnter) this.props.onEnter();
  }

  render() {
    return (
      <Root
        value={this.props.value}
        onChange={this.props.onChange}
        placeholder={this.props.placeholder}
        style={this.props.style}
        onKeyDown={ev => this.handleKeyDown(ev)}
      />
    );
  }
}

const Root = styled.input`
  box-sizing: border-box;
  border-radius: 4px;
  border: solid 1px #aaa;
  width: 100%;
  outline: none;
  padding: ${space.small}px ${space.medium}px;
  
  &:focus {
    border-color: #4caaec;
  }
`;
