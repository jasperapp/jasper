import React, {CSSProperties} from 'react';
import styled from 'styled-components';

type Props = {
  source: {url: string};
  className?: string;
  style?: CSSProperties;
}

type State = {
}

export class Image extends React.Component<Props, State> {
  render() {
    return (
      <Root
        src={this.props.source.url}
        className={this.props.className}
        style={this.props.style}
      />
    );
  }
}

const Root = styled.img`
  box-sizing: border-box;
  max-width: 100%;
  max-height: 100%;
`;
