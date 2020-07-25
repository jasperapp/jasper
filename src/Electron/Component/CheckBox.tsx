import React, {ChangeEvent} from 'react';
import styled from 'styled-components';
import {space} from '../Style/layout';

type Props = {
  checked: boolean;
  onChange(ev: ChangeEvent<HTMLInputElement>): void;
}

type State = {
}

export class CheckBox extends React.Component<Props, State> {
  render() {
    return (
      <Root
        type='checkbox'
        checked={this.props.checked}
        onChange={this.props.onChange}
      />
    );
  }
}

const Root = styled.input`
  margin: 0 ${space.small}px 0 0 !important; 
`;

