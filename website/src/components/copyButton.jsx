import Button from 'react-bootstrap/Button';

const CopyButton = ({ pgn }) => {
  return (
    <Button onClick={() => {navigator.clipboard.writeText(pgn)}}>
      Copy PGN
    </Button>
  );
};

export default CopyButton;