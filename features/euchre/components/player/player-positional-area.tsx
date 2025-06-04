import clsx from 'clsx';
import { TableLocation } from '../../definitions/definitions';
import { getCardClassForPlayerLocation } from '../../util/game/cardDataUtil';
import DummyCard from '../common/dummy-card';

interface Props {
  playerNumber: number;
  width: number;
  height: number;
  location: TableLocation;
  showElements?: boolean;
  responsive?: boolean;
}

const PlayerPositionalArea = ({ playerNumber, width, height, location, showElements, responsive }: Props) => {
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < 5; i++) {
    elements.push(
      <DummyCard
        id={`dummy-${playerNumber}-${i}`}
        key={`dummy-${playerNumber}-${i}`}
        className={clsx('', getCardClassForPlayerLocation(location))}
        width={width}
        height={height}
        responsive={responsive}
        location={location}
        visible={!!showElements}
      ></DummyCard>
    );
  }

  return <>{elements}</>;
};

export default PlayerPositionalArea;
