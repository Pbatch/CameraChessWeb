import Button from 'react-bootstrap/Button';

const LichessButton = ({ pgn }) => {
  return (
    <Button as="a" href="https://lichess.org/paste" target="_blank" rel="noreferrer">
      Lichess Analysis
    </Button>
  );
};

export default LichessButton;