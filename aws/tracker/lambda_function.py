import pickle
import json

import numpy as np

from state import State
from tracker import Tracker


def serialize(obj):
    return pickle.dumps(obj).decode("ISO-8859-1")


def deserialize(s):
    return pickle.loads(s.encode("ISO-8859-1"))


def lambda_handler(body, context):
    print(body)

    preds = body['preds']

    if 'state' in body:
        state = deserialize(body['state'])
    elif 'state_kwargs' in body:
        state = State(**body['state_kwargs'])
    else:
        raise KeyError('Must provide "state" or "state_kwargs"')

    if 'tracker' in body:
        tracker = deserialize(body['tracker'])
    elif 'tracker_kwargs' in body:
        tracker = Tracker(**body['tracker_kwargs'])
    else:
        raise KeyError('Must provide "tracker" or "tracker_kwargs"')

    print("preds", preds)
    for pred in preds:
        pred = np.array(pred) if len(pred) else np.empty(shape=(0, 6))
        print("pred", pred)
        tracker.update(pred)
        state.update(tracker.tracks)

    tracks = [[*track.bbox, track.score, track.piece_idx, track.square] for track in tracker.tracks]
    fen = state.board.fen()
    last_move = state.last_move

    return {
        'statusCode': 200,
        'tracker': serialize(tracker),
        'state': serialize(state),
        'tracks': tracks,
        'fen': fen,
        'last_move': last_move
    }
