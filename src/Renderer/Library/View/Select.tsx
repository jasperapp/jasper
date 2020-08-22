import React, {CSSProperties} from 'react';
import styled from 'styled-components';
import {border, space} from '../Style/layout';
import {appTheme} from '../Style/appTheme';

type Props<T> = {
  items: {label: string; value: T}[];
  onSelect: (value: T) => void;
  value: T;
  className?: string;
  style?: CSSProperties;
}

type State = {
}

export class Select<T extends string = string> extends React.Component<Props<T>, State> {
  private handleChange(ev: React.ChangeEvent<HTMLSelectElement>) {
    this.props.onSelect(ev.target.value as T);
  }

  render() {
    const optionViews = this.props.items.map((item, index) => {
      return <option value={item.value} key={index}>{item.label}</option>
    });

    return (
      <SelectRoot
        onChange={this.handleChange.bind(this)}
        className={this.props.className} style={this.props.style}
        value={this.props.value}
      >
        {optionViews}
      </SelectRoot>
    );
  }
}
const SelectRoot = styled.select`
  box-sizing: border-box;
  width: 100%;
  padding: ${space.small}px;
  border: solid ${border.medium}px ${() => appTheme().borderColor};
  outline: none;
  border-radius: 4px;
  cursor: pointer;
`;
