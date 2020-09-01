import styled from 'styled-components';
import {Text} from '../../Library/View/Text';
import {appTheme} from '../../Library/Style/appTheme';
import {font, fontWeight, space} from '../../Library/Style/layout';

export const SideSectionTitle = styled(Text)`
  flex: 1;
  font-weight: ${fontWeight.softBold};
  color: ${() => appTheme().textSoftColor};
  font-size: ${font.small}px;
  padding: ${space.small2}px ${space.medium}px ${space.tiny}px;
`;
