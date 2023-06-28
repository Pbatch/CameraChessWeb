from collections import namedtuple

import numpy as np

from byte_tracker import BYTETracker
from constants import CLASSES, SQUARE_SIZE, BOARD_SIZE

Track = namedtuple("Track", "piece piece_idx center square score bbox speed")


def get_perspective_transform(keypoints, target):
    A = np.zeros((8, 8), dtype=np.float32)
    B = np.zeros((8, 1), dtype=np.float32)

    for i in range(4):
        x, y = keypoints[i]
        u, v = target[i]
        A[i * 2] = [x, y, 1, 0, 0, 0, -u * x, -u * y]
        A[i * 2 + 1] = [0, 0, 0, x, y, 1, -v * x, -v * y]
        B[i * 2] = u
        B[i * 2 + 1] = v

    matrix = np.linalg.solve(A, B)
    matrix = np.append(matrix, 1.0)
    matrix = matrix.reshape((3, 3))
    return matrix


def perspective_transform(src, matrix):
    homo_src = src.transpose(1, 0, 2)
    homo_src = np.concatenate([homo_src, np.ones((len(homo_src), 1, 1))], axis=2)
    warped_src = homo_src @ matrix.T
    warped_src /= warped_src[..., 2:]
    warped_src = warped_src[..., :2]
    warped_src = warped_src.transpose(1, 0, 2)
    return warped_src


def warp(src, keypoints):
    target = np.array([[BOARD_SIZE, BOARD_SIZE],
                       [0, BOARD_SIZE],
                       [0, 0],
                       [BOARD_SIZE, 0]], dtype=np.float32)
    matrix = get_perspective_transform(keypoints, target)
    inv_matrix = np.linalg.inv(matrix)
    warped_src = perspective_transform(np.expand_dims(src, axis=0), inv_matrix)[0]
    return warped_src


class Tracker:
    def __init__(self, fps, keypoints,
                 track_high_thresh=0.6,
                 track_low_thresh=0.1,
                 new_track_thresh=0.6,
                 track_buffer=60,
                 match_thresh=0.8):
        self.fps = fps
        self.keypoints = keypoints

        self.tracker = BYTETracker(track_high_thresh=track_high_thresh,
                                   track_low_thresh=track_low_thresh,
                                   new_track_thresh=new_track_thresh,
                                   track_buffer=track_buffer,
                                   match_thresh=match_thresh,
                                   frame_rate=self.fps)
        self.tracks = []

        grid = (np.mgrid[0:8, 0:8].reshape(2, -1).T + 0.5) * SQUARE_SIZE
        self.square_centers = warp(grid, self.keypoints)

    def _get_nearest_square(self, center):
        idx = np.argmin(np.sum((center - self.square_centers) ** 2, axis=1))
        x = idx // 8
        y = idx % 8
        return f'{chr(x + 97)}{8 - y}'

    def update(self, detections):
        self.tracker.update(detections)
        tracks = []
        for strack in self.tracker.tracked_stracks:
            if not strack.is_activated:
                continue
            piece_idx = int(strack.cls)
            piece = CLASSES[piece_idx]
            bbox = strack.tlbr.tolist()
            _, _, _, _, vx, vy, _, _ = strack.mean
            speed = vx ** 2 + vy ** 2
            center = [(bbox[0] + bbox[2]) / 2,
                      bbox[3] - ((bbox[2] - bbox[0]) / 4)]
            square = self._get_nearest_square(center)
            score = strack.score
            track = Track(piece, piece_idx, center, square, score, bbox, speed)
            tracks.append(track)
        self.tracks = tracks
