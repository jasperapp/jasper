import React, {CSSProperties} from 'react';
import styled from 'styled-components';
import ReactDOM from 'react-dom';
import {appTheme} from '../Style/appTheme';
import {border} from '../Style/layout';

type Props = {
  onEnd?: () => void;
  className?: string;
  style?: CSSProperties;
}

type State = {
}

export class ScrollView extends React.Component<Props, State> {
  private rootView;
  private bottomView;
  private observer: IntersectionObserver;

  componentDidMount(): void {
    if (this.props.onEnd) this.initIntersectionObserver();
  }

  componentWillUnmount(): void {
    if (this.observer) {
      this.observer.unobserve(ReactDOM.findDOMNode(this.bottomView) as HTMLElement);
      this.observer.disconnect();
    }
  }

  private initIntersectionObserver() {
    const options: IntersectionObserverInit = {
      root: ReactDOM.findDOMNode(this.rootView) as HTMLElement,
      rootMargin: '100px',
      threshold: 0,
    };

    this.observer = new IntersectionObserver((changes) => {
      // targetがrootにenterしたときにみ発火する
      // leaveしたときは発火させない
      // https://blog.jxck.io/entries/2016-06-25/intersection-observer.html
      if (changes[0].intersectionRect.top) {
        this.props.onEnd?.();
      }
    }, options);

    this.observer.observe(ReactDOM.findDOMNode(this.bottomView) as HTMLElement);
  }

  scrollTop() {
    (ReactDOM.findDOMNode(this.rootView) as HTMLElement).scrollTo(0, 0);
  }

  scrollBottom() {
    const el = (ReactDOM.findDOMNode(this.rootView) as HTMLElement);
    el.scrollTo(0, el.scrollHeight);
  }

  scrollBy(y: number) {
    (ReactDOM.findDOMNode(this.rootView) as HTMLElement).scrollBy(0, y);
  }

  render() {
    return (
      <Root
        ref={ref => this.rootView = ref}
        className={this.props.className}
        style={this.props.style}
      >
        {this.props.children}
        <div ref={ref => this.bottomView = ref}/>
      </Root>
    );
  }
}

const Root = styled.div`
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  flex-direction: column;
  box-sizing: border-box;
  outline: none;
  
  /*
  &::-webkit-scrollbar {
    width: 10px;
    border-left: solid ${border.medium}px ${() => appTheme().border.normal};
    overflow: auto;
  }
  &::-webkit-scrollbar-thumb {
    background: ${() => appTheme().bg.primaryHover};
    border-radius: 100px;
  }
  */
`;
