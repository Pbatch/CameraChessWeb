import Button from 'react-bootstrap/Button';

const LichessButton = ({ lichessURL }) => {
  return (
    <Button as="a" href={lichessURL} target="_blank" rel="noreferrer">
      Analyse position on Lichess
    </Button>
  );
};

export default LichessButton;