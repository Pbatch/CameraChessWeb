import chess
import chess.pgn
from constants import CLASSES, PIECE_TO_CLASS, CLASS_TO_PIECE


class State:
    def __init__(self,
                 fen="",
                 move_thresh=0.0,
                 speed_thresh=1.0):
        self.fen = fen
        self.move_thresh = move_thresh
        self.speed_thresh = speed_thresh

        self.change = False
        self.moves = []
        self.game = chess.pgn.Game()
        self.node = self.game
        self.board = chess.Board(self.fen) if self.fen != "" else None
        self.pgn = ""

    def _play_move(self, move):
        self.moves.append(self.board.san(move))
        self.board.push(move)
        self.node = self.node.add_variation(move)
        self.change = True
        self.fen = self.board.fen()
        self.pgn = self.game.accept(chess.pgn.StringExporter())

    def reset(self, tracks):
        self.board = chess.Board("8/8/8/8/8/8/8/8 w - - 0 1")
        for track in tracks:
            self.board.set_piece_at(square=chess.SQUARES[chess.parse_square(track.square)],
                                    piece=CLASS_TO_PIECE[track.piece])
        self.fen = self.board.fen()
        self.game.setup(self.board)
        self.node = self.game
        self.pgn = self.game.accept(chess.pgn.StringExporter())

    def update(self, tracks):
        self.change = False

        square_to_scores = {chess.square_name(square): [0 for _ in range(len(CLASSES))]
                            for square in chess.SQUARES}
        square_to_speed = {chess.square_name(square): 0.0
                           for square in chess.SQUARES}
        for track in tracks:
            piece_idx = CLASSES.index(track.piece)
            square_to_scores[track.square][piece_idx] = max(square_to_scores[track.square][piece_idx], track.score)
            square_to_speed[track.square] = max(square_to_speed[track.square], track.speed)

        valid_moves = []
        for move in list(self.board.legal_moves):
            from_square = str(move)[:2]
            to_square = str(move)[2:4]
            piece_idx = CLASSES.index(PIECE_TO_CLASS[self.board.piece_at(move.from_square)])

            from_score = max(square_to_scores[from_square])
            arrival_score = square_to_scores[to_square][piece_idx]
            arrival_speed = square_to_speed[to_square]

            if from_score > 0:
                continue

            if arrival_score <= self.move_thresh:
                continue

            if arrival_speed > self.speed_thresh and not chess.Board.is_castling(self.board, move):
                continue

            valid_moves.append([str(move), arrival_score])

        if len(valid_moves) == 0:
            return

        best_move = max(valid_moves, key=lambda x: x[1])
        clashing_moves = [move for move in valid_moves if move[0][2:] == best_move[0][2:] and move != best_move]
        if len(clashing_moves):
            print(f'{clashing_moves} clash with {best_move}')
            print('Waiting...')
            return

        self._play_move(chess.Move.from_uci(best_move[0]))
