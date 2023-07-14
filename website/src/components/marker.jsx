import Draggable from 'react-draggable';
import React, { useRef } from "react";
import * as Constants from "../utils/constants.js";

const Marker = ({name, x, y, cornersRef}) => {
  const size = 25;
  const style = {
    "height": size + "px",
    "width": size + "px",
    "backgroundColor": "red",
    "borderRadius": "50%",
    "textAlign": "center",
    "position": "absolute",
    "userSelect": "none"
  };
  const nodeRef = React.useRef(null);

  return (
    <Draggable
    handle="strong"
    bounds="parent"
    defaultPosition={{"x": x, "y": y}}
    nodeRef={nodeRef}
    onStop={(e, data) => {
      const cornerX = (data.x + (size / 2));
      const cornerY = (Constants.MODEL_HEIGHT + data.y + (size / 2) + 6);
      console.log('cornerX', cornerX, 'cornerY', cornerY)
      cornersRef.current = {...cornersRef.current, [name]: {"x": cornerX, "y": cornerY}}
    }}
    >
      <div className="box no-cursor" style={style} ref={nodeRef}>
        <strong className="cursor">{name}</strong>
      </div>
    </Draggable>
  );
};

export default Marker;