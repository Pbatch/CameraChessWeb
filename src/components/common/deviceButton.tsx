import { useEffect, useState } from "react";
import { MEDIA_CONSTRAINTS } from "../../utils/constants";
import type { VideoRef } from "../../types";

const DeviceButton = ({ videoRef }: {videoRef: VideoRef }) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [device, setDevice] = useState<MediaDeviceInfo | null>(null);

  const handleClick = async (newDevice: MediaDeviceInfo) => {
    if (device?.deviceId === newDevice.deviceId) {
      return;
    }

    setDevice(newDevice);

    const baseVideoConstraints = typeof MEDIA_CONSTRAINTS.video === "object"
      ? MEDIA_CONSTRAINTS.video
      : {};
    const constraints: MediaStreamConstraints = {
      ...MEDIA_CONSTRAINTS,
      video: { ...baseVideoConstraints, deviceId: newDevice.deviceId }
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    if (videoRef.current !== null) {
      videoRef.current.srcObject = stream;
    }
  }

  useEffect(() => {
    const newDevices: MediaDeviceInfo[] = [];
    navigator.mediaDevices
    .enumerateDevices()
    .then((devices) => {
      devices.forEach((device: MediaDeviceInfo) => {
        if (device.kind !== "videoinput") {
          return;
        }
        newDevices.push(device);
      });
    })
    .catch((error: unknown) => {
      console.error("Unable to enumerate media devices", error);
    });

    setDevices(newDevices);
  }, [])

  return (
    <div className="dropdown">
      <button type="button" className="btn btn-dark btn-sm btn-outline-light dropdown-toggle w-100" id="deviceButton" data-bs-toggle="dropdown" aria-expanded="false">
      {(device === null) ? "Select a Device": `Device: ${device.label.split("(")[0]}`}
      </button>
      <ul className="dropdown-menu" aria-labelledby="deviceButton">
        {devices.map(device => 
          <li key={device.deviceId}>
            <button type="button" onClick={() => { void handleClick(device).catch(console.error); }} className="dropdown-item">
              {device.label.split("(")[0]}
            </button>
          </li>
        )}
      </ul>
    </div>
  );
};

export default DeviceButton;
