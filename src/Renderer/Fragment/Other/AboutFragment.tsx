import React from 'react';
import {VersionPolling} from '../../Repository/Polling/VersionPolling';
import {Link} from '../../Library/View/Link';
import {font, fontWeight, space} from '../../Library/Style/layout';
import {Modal} from '../../Library/View/Modal';
import {Image} from '../../Library/View/Image';
import {Text} from '../../Library/View/Text';
import {View} from '../../Library/View/View';

type Props = {
  show: boolean;
  onClose(): void;
}

type State = {
}

export class AboutFragment extends React.Component<Props, State> {
  render() {
    return (
      <Modal onClose={this.props.onClose} show={this.props.show} style={{width: 300, height: 300, alignItems: 'center', justifyContent: 'center'}}>
        <Image source={{url: '../image/icon.png'}} style={{width: 100}}/>
        <Text style={{fontWeight: fontWeight.bold, fontSize: font.large}}>Jasper</Text>
        <Text>Version {VersionPolling.getVersion()}</Text>
        <Text>Created by <Link url='https://twitter.com/h13i32maru'>Ryo Maruyama</Link></Text>
        <Text>Icon design by <Link url='http://transitkix.com'>Miwa Kuramitsu</Link></Text>
        <View style={{height: space.large}}/>
        <Text style={{fontSize: font.small, textAlign: 'center'}}>Copyright © 2016 - {new Date().getFullYear()} Ryo Maruyama.<br/>All rights reserved.</Text>
      </Modal>
    );
  }
}
