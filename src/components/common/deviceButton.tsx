import type { Camera } from "../../types";
import { Video } from "lucide-react";
import Dropdown, { DropdownItem } from "./dropdown";

const DeviceButton = ({ camera }: { camera: Camera }) => {
  const device = camera.devices.find((device) => device.deviceId === camera.deviceId);
  const label = (device === undefined) ? "Select a Device" : `Device: ${device.label.split("(")[0]}`;

  return (
    <Dropdown icon={Video} label={label}>
      {camera.devices.map(device =>
        <DropdownItem key={device.deviceId} onClick={() => camera.selectDevice(device.deviceId)}>
          {device.label.split("(")[0]}
        </DropdownItem>
      )}
    </Dropdown>
  );
};

export default DeviceButton;
