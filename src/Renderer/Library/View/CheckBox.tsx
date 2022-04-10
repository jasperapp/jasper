import React, {ChangeEvent, ReactNode} from 'react';
import styled from 'styled-components';
import {space} from '../Style/layout';
import {Text} from './Text';

type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string | ReactNode;
}

type State = {
}

export class CheckBox extends React.Component<Props, State> {
  private handleChange(ev: ChangeEvent<HTMLInputElement>) {
    this.props.onChange(ev.target.checked);
  }

  render() {
    return (
      <RootLabel>
        <CheckBoxView
          type='checkbox'
          checked={this.props.checked}
          onChange={this.handleChange.bind(this)}
          onClick={ev => ev.stopPropagation()}
        />
        <Text style={{cursor: 'pointer'}}>{this.props.label}</Text>
      </RootLabel>
    );
  }
}

const RootLabel = styled.label`
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const CheckBoxView = styled.input`
  margin: 0 ${space.small}px 0 0 !important; 
`;
