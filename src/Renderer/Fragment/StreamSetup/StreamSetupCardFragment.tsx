import React from 'react';
import {StreamSetupFragment} from './StreamSetupFragment';
import {UserPrefRepo} from '../../Repository/UserPrefRepo';
import {FloatingCard} from '../../Library/View/FloatingCard';
import {Translate} from '../../Library/View/Translate';

type Props = {
}

type State = {
  isShow: boolean;
  isShowStreamSetup: boolean;
}

export class StreamSetupCardFragment extends React.Component<Props, State> {
  state: State = {
    isShow: false,
    isShowStreamSetup: false,
  }

  componentDidMount() {
    if (!UserPrefRepo.getPref().general.streamSetupDone) {
      this.setState({isShow: true});
    }
  }

  componentDidUpdate(_prevProps: Readonly<Props>, _prevState: Readonly<State>, _snapshot?: any) {
    if (!this.state.isShow && !UserPrefRepo.getPref().general.streamSetupDone) {
        this.setState({isShow: true});
    }
  }

  private async handleCloseCard() {
    const pref = UserPrefRepo.getPref();
    pref.general.streamSetupDone = true;
    await UserPrefRepo.updatePref(pref);

    this.setState({isShow: false});
  }

  private async handleFinishStreamSetup() {
    const pref = UserPrefRepo.getPref();
    pref.general.streamSetupDone = true;
    await UserPrefRepo.updatePref(pref);

    this.setState({isShow: false, isShowStreamSetup: false});
  }

  render() {
    return (
      <>
        <FloatingCard
          title={<Translate onMessage={mc => mc.streamSetup.card.title}/>}
          isShow={this.state.isShow}
          onClick={() => this.setState({isShowStreamSetup: true})}
          onClose={() => this.handleCloseCard()}
        >
          <Translate onMessage={mc => mc.streamSetup.card.desc}/>
        </FloatingCard>

        <StreamSetupFragment
          isShow={this.state.isShowStreamSetup}
          onClose={() => this.setState({isShowStreamSetup: false})}
          onFinish={() => this.handleFinishStreamSetup()}
        />
      </>
    );
  }
}
