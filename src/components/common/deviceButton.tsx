import type { Camera } from "../../types";
import Icon from "./icon";

const DeviceButton = ({ camera }: { camera: Camera }) => {
  const device = camera.devices.find((device) => device.deviceId === camera.deviceId);
  const label = (device === undefined) ? "Select a Device" : `Device: ${device.label.split("(")[0]}`;

  return (
    <div className="dropdown">
      <button type="button" className="btn btn-dark btn-sm btn-outline-light dropdown-toggle w-100 d-flex align-items-center justify-content-center" id="deviceButton" data-bs-toggle="dropdown" aria-expanded="false"
        title={label}>
        <Icon iconName="bi-camera-video" className="me-2" />
        <span className="text-truncate">{label}</span>
      </button>
      <ul className="dropdown-menu" aria-labelledby="deviceButton">
        {camera.devices.map(device =>
          <li key={device.deviceId}>
            <button type="button" onClick={() => camera.selectDevice(device.deviceId)} className="dropdown-item">
              {device.label.split("(")[0]}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
};

export default DeviceButton;
