import Draggable from 'react-draggable';
import React from "react";
import { MARKER_DIAMETER } from "../../utils/constants.jsx";
import { useDispatch } from 'react-redux';
import { cornersSet } from '../../slices/cornersSlice.jsx';

const Marker = ({ name, xy }) => {
  const boxStyle = {
    "height": MARKER_DIAMETER,
    "width": MARKER_DIAMETER,
    "backgroundColor": "red",
    "borderRadius": "50%",
    "textAlign": "center",
    "position": "absolute",
    "userSelect": "none",
    "opacity": 0.5
  };
  const cursorStyle = {
    "display": "flex",
    "height": "100%",
    "width": "100%",
    "textAlign": "center",
    "justifyContent": "center",
    "alignItems": "center"
  }
  const nodeRef = React.useRef(null);
  const dispatch = useDispatch();

  return (
    <Draggable
    handle="strong"
    bounds="parent"
    position={{"x": xy[0], "y": xy[1]}}
    defaultPosition={{"x": xy[0], "y": xy[1]}}
    nodeRef={nodeRef}
    onStop={(e, data) => {
      const payload = {
        "xy": [data.x, data.y],
        "key": name
      }
      console.info(payload);
      dispatch(cornersSet(payload))
    }}
    >
      <div className="box no-cursor" style={boxStyle} ref={nodeRef}>
        <strong className="cursor" style={cursorStyle}>{name}</strong>
      </div>
    </Draggable>
  );
};

export default Marker;