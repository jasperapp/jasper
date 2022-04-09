import React, {ChangeEvent, CSSProperties, KeyboardEvent} from 'react';
import styled from 'styled-components';
import {border, space} from '../Style/layout';
import {appTheme} from '../Style/appTheme';
import {View} from './View';
import {ClickView} from './ClickView';
import {Text} from './Text';
import {color} from '../Style/color';
import {Icon} from './Icon';

type Props = {
  value: string | number;
  completions?: string[];
  onChange: (text: string) => void;
  onEnter?: (ev: React.KeyboardEvent) => void;
  onEscape?: (ev: React.KeyboardEvent) => void;
  onArrowDown?: () => void;
  onArrowUp?: () => void;
  onClear?: () => void;
  onFocusCompletion?: (completion: string) => void;
  onSelectCompletion?: (completion: string) => void;
  onClick?: () => void;
  onBlur?: () => void;
  showClearButton?: 'ifNeed' | 'always' | null;
  placeholder?: string;
  style?: CSSProperties;
  readOnly?: boolean;
  type?: string;
  secure?: boolean;
  max?: number;
  min?: number;
  autoFocus?: boolean;
  hasError?: boolean;
  className?: string;
}

type State = {
  showCompletions: boolean;
  focusCompletionIndex: number;
  completions: string[];
  focus: boolean;
  type?: string;
}

export class TextInput extends React.Component<Props, State> {
  static defaultProps = {completions: []};

  state: State = {
    showCompletions: false,
    focusCompletionIndex: null,
    completions: this.props.completions || [],
    focus: false,
    type: this.props.secure ? 'password' : this.props.type,
  }

  private htmlInputElement: HTMLInputElement;

  componentDidUpdate(prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    if (this.props.type !== prevProps.type) {
      this.setState({type: this.props.type});
    }
  }

  focus() {
    this.htmlInputElement.focus();
  }

  select() {
    this.htmlInputElement?.select();
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

    if (ev.key === 'ArrowDown' && this.props.onArrowDown) {
      ev.preventDefault();
      this.props.onArrowDown();
      return;
    }

    if (ev.key === 'ArrowUp' && this.props.onArrowUp) {
      ev.preventDefault();
      this.props.onArrowUp();
      return;
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

  private handleKeyPress(ev: KeyboardEvent<HTMLInputElement>) {
    if (ev.key === 'Enter' && this.props.onEnter) {
      this.setState({showCompletions: false});
      this.props.onEnter(ev);
      return
    }
  }

  private handleFocus() {
    this.setState({focus: true});
    this.handleShowCompletions(true);
  }

  private handleBlur() {
    this.props.onBlur?.();
    this.setState({focus: false});

    // すぐにcompletionsを消してしまうと、completionのクリックがうまく発火しないので遅延させる
    setTimeout(() => this.handleShowCompletions(false), 200);
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
    const focusClassName = this.state.focus ? 'text-input-focus' : '';
    const hasErrorClassName = this.props.hasError ? 'text-input-has-error' : '';

    return (
      <Root>
        <TextInputWrap
          className={`${focusClassName} ${hasErrorClassName} ${this.props.className}`}
          style={this.props.style}
        >
          <TextInputElement
            ref={ref => this.htmlInputElement = ref}
            value={this.props.value}
            onChange={this.handleChange.bind(this)}
            onKeyDown={ev => this.handleKeyDown(ev)}
            onKeyPress={ev => this.handleKeyPress(ev)}
            onFocus={() => this.handleFocus()}
            onMouseDown={() => this.handleShowCompletions(true)}
            onBlur={() => this.handleBlur()}
            onClick={() => this.props.onClick?.()}
            placeholder={this.props.placeholder}
            readOnly={this.props.readOnly}
            type={this.state.type}
            max={this.props.max}
            min={this.props.min}
            autoFocus={this.props.autoFocus}
          />
          {this.renderClearButton()}
          {this.renderPasswordToggleButton()}
        </TextInputWrap>
        {this.renderCompletions()}
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
          <CompletionText singleLine={true} className={selectedClassName}>{completion}</CompletionText>
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
    if (this.props.showClearButton === 'ifNeed' && !this.props.value) return;

    return (
      <ClearButton onClick={() => this.handleClearText()}>
        <Icon name='close-circle'/>
      </ClearButton>
    );
  }

  private renderPasswordToggleButton() {
    if (!this.props.secure) return;

    return (
      <PasswordToggleButton onClick={() => this.setState({type: this.state.type === 'password' ? 'text' : 'password'})}>
        <Icon name='eye'/>
      </PasswordToggleButton>
    )
  }
}

const Root = styled(View)`
  position: relative;
  overflow: visible;
  width: 100%;
  flex-direction: row;
`;

const TextInputWrap = styled(View)`
  flex-direction: row;
  align-items: center;
  width: 100%; 
  border-radius: 4px;
  border: solid 1px ${() => appTheme().border.normal};
  color: ${() => appTheme().text.normal};
  
  &.text-input-focus {
    border-color: ${() => appTheme().accent.soft};
  }
`;

const TextInputElement = styled.input`
  box-sizing: border-box;
  flex: 1;
  outline: none;
  padding: ${space.small2}px ${space.medium}px;
  border: none;
  background: inherit;
  color: inherit;
  
  &::placeholder {
    color: ${() => appTheme().text.tiny};
  }
  
  &[readonly] {
    background: ${() => appTheme().bg.primarySoft};
  }
  
  .text-input-has-error & {
    background: ${() => appTheme().textInput.errorBg};
  }
`;

// completions
const Completions = styled(View)`
  position: absolute;
  top: 29px;
  left: 0;
  width: 100%;
  background: ${() => appTheme().bg.primary};
  z-index: 9999;
  border: solid ${border.medium}px ${() => appTheme().border.normal};
  border-radius: 0 0 4px 4px;
  box-shadow: 0 0 8px 4px #00000012;
`;

const Completion = styled(ClickView)`
`;

const CompletionText = styled(Text)`
  padding: ${space.small}px;
  
  &.selected, &:hover {
    background: ${() => appTheme().accent.normal};
    color: ${color.white};
  }
`;

// clear text
const ClearButton = styled(ClickView)`
  padding-right: ${space.small}px;
`;

// password toggle
const PasswordToggleButton = styled(ClickView)`
  padding-right: ${space.small}px;
`;
