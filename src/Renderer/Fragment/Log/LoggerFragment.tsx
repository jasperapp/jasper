import React, {useEffect, useRef, useState} from 'react';
import {Modal} from '../../Library/View/Modal';
import {Logger} from '../../Library/Infra/Logger';
import styled from 'styled-components';
import {ScrollView} from '../../Library/View/ScrollView';
import {LogView} from './LogView';
import {View} from '../../Library/View/View';
import {AppEvent} from '../../Event/AppEvent';

export const LoggerFragment: React.FC = () => {
  const ownerRef = useRef({});
  const [isDisplay, setIsDisplay] = useState(false);
  const [logs, setLogs] = useState(Logger.getLogs());

  useEffect(() => {
    for (let i = 0; i < 100; i++) {
      Logger.error('label1', 'aaaaaaaaa', {foo: [1,2,3]});
      Logger.verbose('label2', 'bbbbb', {bar: true, foo: 'aaaaa'});
      Logger.warning('label3', 'cccccccccccccccccccc', {bar: true, foo: 'aaaaa'});
    }

    AppEvent.onOpenLogView(ownerRef.current, () => setIsDisplay(true));
    Logger.onNewLog(ownerRef.current, () => setLogs([...Logger.getLogs()]));

    return () => {
      AppEvent.offAll(ownerRef.current);
      Logger.offAll(ownerRef.current);
    };
  }, []);


  return (
    <Modal show={isDisplay} onClose={() => setIsDisplay(false)}>
      <Body>
        <ScrollView ref={ref => ref?.scrollBottom()}>
          {logs.map(log => <LogView log={log} key={log.id}/>)}
        </ScrollView>
      </Body>
    </Modal>
  );
}

const Body = styled(View)`
  width: 60vw;
  height: 80vh;
`;
