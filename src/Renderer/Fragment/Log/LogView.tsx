import React, {useState} from 'react';
import {Log} from '../../Library/Infra/Logger';
import {DateUtil} from '../../Library/Util/DateUtil';
import styled from 'styled-components';
import {ClickView} from '../../Library/View/ClickView';
import {Icon} from '../../Library/View/Icon';
import {border, space} from '../../Library/Style/layout';
import {View} from '../../Library/View/View';

type Props = {
  log: Log;
}

export const LogView: React.FC<Props> = (props) => {
  const log = props.log;
  const [isOpenDetails, setIsOpenDetails] = useState(false);

  const details = isOpenDetails ? JSON.stringify(log.details, null, 2) : '';

  return (
    <Root level={log.level}>
      <Id>{log.id}</Id>
      <Time>{DateUtil.localToString(new Date(log.createdAt))}</Time>
      <Label>{log.label}</Label>
      <Message>
        <StyledClickView onClick={() => setIsOpenDetails(!isOpenDetails)}>
          <StyledIcon name={isOpenDetails ? 'menu-down' : 'menu-right'}/>
          <MessageText>{log.message}</MessageText>
        </StyledClickView>
        <Details isDisplay={isOpenDetails}><pre>{details}</pre></Details>
      </Message>
    </Root>
  );
}

const colors: Record<Log['level'], string> = {
  error: '#FFEEEE',
  warning: '#FFFAE2',
  info: 'inherit',
  verbose: '#EFF1F2',
};

const borderColors: Record<Log['level'], string> = {
  error: '#FFD0D1',
  warning: '#FFF3BD',
  info: 'transparent',
  verbose: '#DADDDF',
};

const Root = styled(View)<{level: Log['level']}>`
  width: 100%;
  background-color: ${(props) => colors[props.level]};
  border: solid ${border.medium}px ${(props) => borderColors[props.level]};
  user-select: initial;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
`;

const Id = styled.div`
  padding: ${space.small}px ${space.medium}px;
`;

const Time = styled.div`
  padding: ${space.small}px ${space.medium}px;
  min-width: 12em;
`;

const Label = styled.div`
  padding: ${space.small}px ${space.medium}px;
  min-width: 12em;
`;

const Message = styled.div`
  flex: 1;
  padding: ${space.small}px ${space.medium}px;
  overflow-x: scroll;
`;

const StyledClickView = styled(ClickView)`
  display: block;
  vertical-align: text-bottom;
  overflow: visible;
`;

const StyledIcon = styled(Icon)`
  display: inline;
`;

const MessageText = styled.span`
`;

const Details = styled.code<{isDisplay: boolean}>`
  display: ${props => props.isDisplay ? 'block' : 'none'};
`;
