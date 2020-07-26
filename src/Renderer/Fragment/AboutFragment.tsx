import React from 'react';
import styled from 'styled-components';
import {VersionRepo} from '../Repository/VersionRepo';
import {Link} from '../Component/Link';
import {font} from '../Style/layout';
import {Modal} from '../Component/Modal';

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
        <Image src='../image/icon.png'/>
        <Title>Jasper</Title>
        <div>Version {VersionRepo.getVersion()}</div>
        <div>Created by <Link url='https://twitter.com/h13i32maru'>Ryo Maruyama</Link></div>
        <div>Icon design by <Link url='http://transitkix.com'>Miwa Kuramitsu</Link></div>
        <br/>
        <Copyright>Copyright © 2020 Ryo Maruyama.<br/>All rights reserved.</Copyright>
      </Modal>
    );
  }
}

const Image = styled.img`
  width: 100px;
`;

const Title = styled.div`
  font-weight: bold;
  font-size: ${font.large}px;
`;

const Copyright = styled.div`
  font-size: ${font.small}px;
  text-align: center;
`;


