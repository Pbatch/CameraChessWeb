import chess

CLASS_TO_PIECE = {'black-bishop': chess.Piece(chess.BISHOP, chess.BLACK),
                  'black-king': chess.Piece(chess.KING, chess.BLACK),
                  'black-knight': chess.Piece(chess.KNIGHT, chess.BLACK),
                  'black-pawn': chess.Piece(chess.PAWN, chess.BLACK),
                  'black-queen': chess.Piece(chess.QUEEN, chess.BLACK),
                  'black-rook': chess.Piece(chess.ROOK, chess.BLACK),
                  'white-bishop': chess.Piece(chess.BISHOP, chess.WHITE),
                  'white-king': chess.Piece(chess.KING, chess.WHITE),
                  'white-knight': chess.Piece(chess.KNIGHT, chess.WHITE),
                  'white-pawn': chess.Piece(chess.PAWN, chess.WHITE),
                  'white-queen': chess.Piece(chess.QUEEN, chess.WHITE),
                  'white-rook': chess.Piece(chess.ROOK, chess.WHITE)}
PIECE_TO_CLASS = {v: k for k, v in CLASS_TO_PIECE.items()}
CLASSES = list(CLASS_TO_PIECE.keys())
SQUARE_SIZE = 128
BOARD_SIZE = 8 * SQUARE_SIZE
