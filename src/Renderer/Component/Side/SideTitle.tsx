import styled from 'styled-components';
import {Text} from '../Text';
import {appTheme} from '../../Style/appTheme';
import {font, fontWeight, space} from '../../Style/layout';

export const SideTitle = styled(Text)`
  flex: 1;
  font-weight: ${fontWeight.softBold};
  color: ${() => appTheme().textSoftColor};
  font-size: ${font.small}px;
  padding: 0 ${space.medium}px;
`;
