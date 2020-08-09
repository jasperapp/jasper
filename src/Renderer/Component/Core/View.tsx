import React, {CSSProperties} from 'react';
import styled from 'styled-components';

type Props = {
  className?: string;
  style?: CSSProperties;
  title?: string;
  onContextMenu?: () => void;
}

type State = {
}

export class View extends React.Component<Props, State> {
  private handleContextMenu(ev: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    ev.preventDefault();
    ev.stopPropagation();
    this.props.onContextMenu && this.props.onContextMenu();
  }

  render() {
    return (
      <Root
        className={this.props.className}
        style={this.props.style}
        onContextMenu={this.handleContextMenu.bind(this)}
        title={this.props.title}
      >
        {this.props.children}
      </Root>
    );
  }
}

const Root = styled.div`
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
`;