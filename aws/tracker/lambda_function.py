import pickle

import numpy as np

from state import State
from tracker import Tracker


def serialize(obj):
    return pickle.dumps(obj).decode("ISO-8859-1")


def deserialize(s):
    return pickle.loads(s.encode("ISO-8859-1"))


def lambda_handler(body, context):
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

    for pred in preds:
        pred = np.array(pred) if len(pred) else np.empty(shape=(0, 6))
        tracker.update(pred)
        if state.fen != "":
            state.update(tracker.tracks)

    if state.fen == "":
        state.reset(tracker.tracks)

    tracks = [[*track.bbox, track.score, track.piece_idx, track.square] for track in tracker.tracks]

    return {
        'statusCode': 200,
        'tracker': serialize(tracker),
        'state': serialize(state),
        'tracks': tracks,
        'fen': state.fen,
        'pgn': state.pgn
    }
