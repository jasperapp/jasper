import React, {ChangeEvent, CSSProperties, KeyboardEvent} from 'react';
import styled from 'styled-components';
import {space} from '../Style/layout';

type Props = {
  value: string | number;
  onChange: (text: string) => void;
  placeholder?: string;
  style?: CSSProperties;
  onEnter?: () => void;
  readOnly?: boolean;
  type?: string;
  max?: number;
  min?: number;
}

type State = {
}

export class TextInput extends React.Component<Props, State> {
  private handleKeyDown(ev: KeyboardEvent<HTMLInputElement>) {
    if (ev.key === 'Enter' && this.props.onEnter) this.props.onEnter();
  }

  private handleChange(ev: ChangeEvent<HTMLInputElement>) {
    this.props.onChange(ev.target.value);
  }

  render() {
    return (
      <Root
        value={this.props.value}
        onChange={this.handleChange.bind(this)}
        placeholder={this.props.placeholder}
        style={this.props.style}
        onKeyDown={ev => this.handleKeyDown(ev)}
        readOnly={this.props.readOnly}
        type={this.props.type}
        max={this.props.max}
        min={this.props.min}
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
