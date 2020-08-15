import React, {ChangeEvent, CSSProperties, KeyboardEvent} from 'react';
import styled from 'styled-components';
import {border, space} from '../../Style/layout';
import {appTheme} from '../../Style/appTheme';
import {View} from './View';
import {ClickView} from './ClickView';
import {Text} from './Text';
import {color} from '../../Style/color';
import {Icon} from './Icon';

type Props = {
  value: string | number;
  completions?: string[];
  onChange: (text: string) => void;
  onEnter?: (ev: React.KeyboardEvent) => void;
  onEscape?: (ev: React.KeyboardEvent) => void;
  onClear?: () => void;
  onFocusCompletion?: (completion: string) => void;
  onSelectCompletion?: (completion: string) => void;
  onClick?: () => void;
  showClearButton?: boolean;
  placeholder?: string;
  style?: CSSProperties;
  readOnly?: boolean;
  type?: string;
  max?: number;
  min?: number;
  autoFocus?: boolean;
  className?: string;
}

type State = {
  showCompletions: boolean;
  focusCompletionIndex: number;
  completions: string[];
}

export class TextInput extends React.Component<Props, State> {
  static defaultProps = {completions: []};

  state: State = {
    showCompletions: false,
    focusCompletionIndex: null,
    completions: this.props.completions || [],
  }

  private htmlInputElement: HTMLInputElement;

  focus() {
    this.htmlInputElement.focus();
  }

  select() {
    this.htmlInputElement.select();
  }

  private handleChange(ev: ChangeEvent<HTMLInputElement>) {
    const text = ev.target.value;

    // filtering completions
    const completions = this.props.completions.filter(c => c.includes(text));
    this.setState({completions});

    this.props.onChange(text);
  }

  private handleKeyDown(ev: KeyboardEvent<HTMLInputElement>) {
    if (ev.key === 'Escape' && this.props.onEscape) {
      this.setState({showCompletions: false});
      this.props.onEscape(ev);
      return
    }

    if (ev.key === 'Enter' && this.props.onEnter) {
      this.setState({showCompletions: false});
      this.props.onEnter(ev);
      return
    }

    // keydown/keyup completion
    if (this.state.completions.length) {
      if (ev.key === 'ArrowDown') {
        if (this.state.showCompletions) {
          const nextIndex = this.state.focusCompletionIndex !== null ? this.state.focusCompletionIndex + 1: 0;
          const focusIndex = Math.min(nextIndex, this.state.completions.length - 1);
          this.handleFocusCompletion(focusIndex);
        } else {
          this.handleShowCompletions(true);
          this.handleFocusCompletion(0);
        }
      } else if (ev.key === 'ArrowUp') {
        if (this.state.showCompletions) {
          const prevIndex = this.state.focusCompletionIndex !== null ? this.state.focusCompletionIndex - 1 : this.state.completions.length - 1;
          const focusIndex = Math.max(prevIndex, 0);
          this.handleFocusCompletion(focusIndex);
        } else {
          this.handleShowCompletions(true);
          this.handleFocusCompletion(this.state.completions.length - 1);
        }
      }
    }
  }

  private handleShowCompletions(show: boolean) {
    if (show) {
      this.setState({
        showCompletions: show,
        completions: this.props.completions,
        focusCompletionIndex: null,
      });
    } else {
      this.setState({showCompletions: show});
    }
  }

  private handleFocusCompletion(index) {
    this.setState({focusCompletionIndex: index});

    const text = this.state.completions[index];
    this.props.onFocusCompletion?.(text);
  }

  private handleSelectCompletion(index: number) {
    this.setState({showCompletions: false});

    const text = this.state.completions[index];
    this.props.onSelectCompletion?.(text);
  }

  private handleClearText() {
    this.props.onClear?.();
    this.setState({completions: this.props.completions});
  }

  render() {
    return (
      <Root>
        <TextInputElement
          ref={ref => this.htmlInputElement = ref}
          value={this.props.value}
          onChange={this.handleChange.bind(this)}
          onKeyDown={ev => this.handleKeyDown(ev)}
          onFocus={() => this.handleShowCompletions(true)}
          onMouseDown={() => this.handleShowCompletions(true)}
          onClick={() => this.props.onClick?.()}
          // すぐにcompletionsを消してしまうと、completionのクリックがうまく発火しないので遅延させる
          onBlur={() => setTimeout(() => this.handleShowCompletions(false), 200)}
          placeholder={this.props.placeholder}
          style={this.props.style}
          readOnly={this.props.readOnly}
          type={this.props.type}
          max={this.props.max}
          min={this.props.min}
          autoFocus={this.props.autoFocus}
          className={this.props.className}
        />
        {this.renderCompletions()}
        {this.renderClearButton()}
      </Root>
    );
  }

  private renderCompletions() {
    if (!this.state.showCompletions) return;
    if (!this.state.completions.length) return;

    const completionViews = this.state.completions.map((completion, index) => {
      const selectedClassName = index === this.state.focusCompletionIndex ? 'selected' : '';
      return (
        <Completion key={index} onClick={() => this.handleSelectCompletion(index)}>
          <CompletionText className={selectedClassName}>{completion}</CompletionText>
        </Completion>
      );
    });

    return (
      <Completions>
        {completionViews}
      </Completions>
    );
  }

  private renderClearButton() {
    if (!this.props.showClearButton) return;
    if (!this.props.value) return;

    return (
      <ClearButton onClick={() => this.handleClearText()}>
        <Icon name='close-circle'/>
      </ClearButton>
    );
  }
}

const Root = styled(View)`
  position: relative;
  overflow: visible;
  width: 100%;
  flex-direction: row;
`;

const TextInputElement = styled.input`
  box-sizing: border-box;
  border-radius: 4px;
  border: solid 1px ${() => appTheme().borderColor};
  flex: 1;
  outline: none;
  padding: ${space.small}px ${space.medium}px;
  
  &:focus {
    border-color: ${color.lightBlue};
  }
  
  &[readonly] {
    background: ${() => appTheme().textInputReadOnly};
  }
`;

// completions
const Completions = styled(View)`
  position: absolute;
  top: 30px;
  left: 0;
  width: 100%;
  background: ${() => appTheme().bg};
  z-index: 9999;
  border: solid ${border.medium}px ${() => appTheme().borderColor};
  border-radius: 0 0 4px 4px;
`;

const Completion = styled(ClickView)`
`;

const CompletionText = styled(Text)`
  padding: ${space.small}px;
  
  &.selected, &:hover {
    background: ${color.lightBlue};
    color: ${color.white};
  }
`;

// clear text
const ClearButton = styled(ClickView)`
  position: absolute;
  top: 6px;
  right: 6px;
`;
