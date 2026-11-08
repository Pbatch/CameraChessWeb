import { useTranslation } from "react-i18next";
import type { Camera } from "../../types";
import { Video } from "lucide-react";
import Dropdown, { DropdownItem } from "./dropdown";

const DeviceButton = ({ camera, disabled = false }: { camera: Camera, disabled?: boolean }) => {
  const device = camera.devices.find((device) => device.deviceId === camera.deviceId);
  const { t } = useTranslation();
  const label = (device === undefined) ? t("device.select") : t("device.selected", { name: device.label.split("(")[0] });

  return (
    <Dropdown icon={Video} label={label} disabled={disabled}>
      {camera.devices.map(device =>
        <DropdownItem key={device.deviceId} onClick={() => camera.selectDevice(device.deviceId)}>
          {device.label.split("(")[0]}
        </DropdownItem>
      )}
    </Dropdown>
  );
};

export default DeviceButton;
