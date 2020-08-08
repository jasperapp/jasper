import React from 'react';
import {VersionRepo} from '../Repository/VersionRepo';
import {Link} from '../Component/Link';
import {font, fontWeight, space} from '../Style/layout';
import {Modal} from '../Component/Modal';
import {Image} from '../Component/Image';
import {Text} from '../Component/Text';
import {View} from '../Component/VIew';

type Props = {
  show: boolean;
  onClose(): void;
}

type State = {
}

export class ModalAboutFragment extends React.Component<Props, State> {
  render() {
    return (
      <Modal onClose={this.props.onClose} show={this.props.show} style={{width: 300, height: 300, alignItems: 'center', justifyContent: 'center'}}>
        <Image source={{url: '../image/icon.png'}} style={{width: 100}}/>
        <Text style={{fontWeight: fontWeight.bold, fontSize: font.large}}>Jasper</Text>
        <Text>Version {VersionRepo.getVersion()}</Text>
        <Text>Created by <Link url='https://twitter.com/h13i32maru'>Ryo Maruyama</Link></Text>
        <Text>Icon design by <Link url='http://transitkix.com'>Miwa Kuramitsu</Link></Text>
        <View style={{height: space.large}}/>
        <Text style={{fontSize: font.small, textAlign: 'center'}}>Copyright © 2020 Ryo Maruyama.<br/>All rights reserved.</Text>
      </Modal>
    );
  }
}

