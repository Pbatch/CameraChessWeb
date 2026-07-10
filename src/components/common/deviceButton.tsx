import { useEffect, useState } from "react";
import { MEDIA_CONSTRAINTS } from "../../utils/constants";

const DeviceButton = ({ videoRef }: { videoRef: any }) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [device, setDevice] = useState<MediaDeviceInfo | null>(null);

  const handleClick = async (e: any, newDevice: MediaDeviceInfo) => {
    e.preventDefault();

    if (device?.deviceId === newDevice.deviceId) {
      return;
    }

    // Stop current stream tracks before requesting a new one
    if (videoRef.current && videoRef.current.srcObject) {
      const currentStream = videoRef.current.srcObject as MediaStream;
      currentStream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    setDevice(newDevice);

    const constraints: any = JSON.parse(JSON.stringify(MEDIA_CONSTRAINTS));
    constraints["video"]["deviceId"] = { exact: newDevice.deviceId };
    // Remove facingMode when deviceId is specified to avoid conflicts
    delete constraints["video"]["facingMode"];

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error switching camera:", err);
      // Fallback to default constraints if specific device fails
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
        }
      } catch (fallbackErr) {
        console.error("Fallback camera failed:", fallbackErr);
      }
    }
  };

  useEffect(() => {
    const updateDevices = () => {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoDevices = devices.filter(d => d.kind === "videoinput");
          setDevices(videoDevices);

          // Try to sync the dropdown state with the currently active device
          if (videoRef.current && videoRef.current.srcObject) {
            const currentTrack = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0];
            if (currentTrack) {
              const settings = currentTrack.getSettings();
              const activeDevice = videoDevices.find(d => d.deviceId === settings.deviceId);
              if (activeDevice) {
                setDevice(activeDevice);
              }
            }
          }
        })
        .catch((err) => {
          console.error(`${err.name}: ${err.message}`);
        });
    };

    updateDevices();

    // Re-run when devices change (e.g. plugging in a USB camera)
    navigator.mediaDevices.addEventListener('devicechange', updateDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', updateDevices);
    };
  }, []);

  return (
    <div className="dropdown">
      <button className="btn btn-dark btn-sm btn-outline-light dropdown-toggle w-100" id="deviceButton" data-bs-toggle="dropdown" aria-expanded="false">
        {(device === null) ? "Select a Device" : `Device: ${device.label.split("(")[0] || "Default"}`}
      </button>
      <ul className="dropdown-menu" aria-labelledby="deviceButton">
        {devices.map(device =>
          <li key={device.deviceId}>
            <a onClick={(e) => handleClick(e, device)} className="dropdown-item" href="#">
              {device.label.split("(")[0] || `Camera ${device.deviceId.slice(0, 4)}`}
            </a>
          </li>
        )}
      </ul>
    </div>
  );
};

export default DeviceButton;