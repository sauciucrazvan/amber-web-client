import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getSettings, setSettings } from "@/platform";

type MediaDeviceOption = {
  deviceId: string;
  label: string;
};

type AppSettingsPayload = {
  preferredMicrophoneId?: string;
  preferredCameraId?: string;
  preferredSpeakerId?: string;
};

type DeviceRowProps = {
  title: string;
  description: string;
  value: string;
  placeholder: string;
  options: MediaDeviceOption[];
  onValueChange: (value: string) => void;
};

function DeviceRow(props: DeviceRowProps) {
  return (
    <div className="w-full flex flex-row justify-between items-start gap-1">
      <div className="min-w-0 w-full">
        <h3 className="text-sm font-semibold text-primary leading-tight">
          {props.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-snug">
          {props.description}
        </p>
      </div>

      <div className="w-full min-w-0 justify-self-end">
        <Select
          value={props.value}
          onValueChange={props.onValueChange}
          disabled={props.options.length === 0}
        >
          <SelectTrigger className="h-9 w-full text-sm">
            <SelectValue placeholder={props.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {props.options.length === 0 ? (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                {props.placeholder}
              </p>
            ) : (
              props.options.map((device) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default function DevicesTab() {
  const [microphones, setMicrophones] = useState<MediaDeviceOption[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceOption[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceOption[]>([]);
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState("");
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [selectedSpeakerId, setSelectedSpeakerId] = useState("");
  const { t } = useTranslation();

  const saveSettings = useCallback((next: AppSettingsPayload) => {
    void setSettings(next);
  }, []);

  const toDeviceOptions = useCallback(
    (
      devices: MediaDeviceInfo[],
      kind: MediaDeviceKind,
      fallbackKey: string,
    ): MediaDeviceOption[] => {
      return devices
        .filter((device) => device.kind === kind)
        .map((device, index) => ({
          deviceId: device.deviceId,
          label:
            device.label ||
            t(fallbackKey, {
              index: index + 1,
            }),
        }));
    },
    [t],
  );

  const selectValidDeviceId = useCallback(
    (currentValue: string, options: MediaDeviceOption[]) => {
      if (options.length === 0) return "";
      if (
        currentValue &&
        options.some((item) => item.deviceId === currentValue)
      ) {
        return currentValue;
      }

      return options[0].deviceId;
    },
    [],
  );

  const refreshMediaDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const nextMicrophones = toDeviceOptions(
        devices,
        "audioinput",
        "settings.general.devices.microphone.fallback",
      );
      const nextCameras = toDeviceOptions(
        devices,
        "videoinput",
        "settings.general.devices.camera.fallback",
      );
      const nextSpeakers = toDeviceOptions(
        devices,
        "audiooutput",
        "settings.general.devices.speaker.fallback",
      );

      setMicrophones(nextMicrophones);
      setCameras(nextCameras);
      setSpeakers(nextSpeakers);

      setSelectedMicrophoneId((current) =>
        selectValidDeviceId(current, nextMicrophones),
      );
      setSelectedCameraId((current) =>
        selectValidDeviceId(current, nextCameras),
      );
      setSelectedSpeakerId((current) =>
        selectValidDeviceId(current, nextSpeakers),
      );
    } catch {
      return;
    }
  }, [selectValidDeviceId, toDeviceOptions]);

  useEffect(() => {
    let isMounted = true;
    void getSettings()
      .then((value: AppSettingsPayload | undefined) => {
        if (!isMounted || !value) return;

        if (typeof value.preferredMicrophoneId === "string") {
          setSelectedMicrophoneId(value.preferredMicrophoneId);
        }
        if (typeof value.preferredCameraId === "string") {
          setSelectedCameraId(value.preferredCameraId);
        }
        if (typeof value.preferredSpeakerId === "string") {
          setSelectedSpeakerId(value.preferredSpeakerId);
        }
      })
      .catch(() => {
        return;
      });

    void refreshMediaDevices();

    if (navigator.mediaDevices) {
      const onDevicesChanged = () => {
        void refreshMediaDevices();
      };

      navigator.mediaDevices.addEventListener("devicechange", onDevicesChanged);
      return () => {
        isMounted = false;
        navigator.mediaDevices.removeEventListener(
          "devicechange",
          onDevicesChanged,
        );
      };
    }

    return () => {
      isMounted = false;
    };
  }, [refreshMediaDevices]);

  return (
    <div className="flex min-h-0 h-full w-full min-w-0 flex-col">
      <div className="mt-2 space-y-3 min-w-0">
        <DeviceRow
          title={t("settings.general.devices.microphone.title")}
          description={t("settings.general.devices.microphone.description")}
          value={selectedMicrophoneId}
          placeholder={t("settings.general.devices.microphone.empty")}
          options={microphones}
          onValueChange={(value) => {
            setSelectedMicrophoneId(value);
            saveSettings({ preferredMicrophoneId: value });
          }}
        />

        <DeviceRow
          title={t("settings.general.devices.camera.title")}
          description={t("settings.general.devices.camera.description")}
          value={selectedCameraId}
          placeholder={t("settings.general.devices.camera.empty")}
          options={cameras}
          onValueChange={(value) => {
            setSelectedCameraId(value);
            saveSettings({ preferredCameraId: value });
          }}
        />

        <DeviceRow
          title={t("settings.general.devices.speaker.title")}
          description={t("settings.general.devices.speaker.description")}
          value={selectedSpeakerId}
          placeholder={t("settings.general.devices.speaker.empty")}
          options={speakers}
          onValueChange={(value) => {
            setSelectedSpeakerId(value);
            saveSettings({ preferredSpeakerId: value });
          }}
        />
      </div>
    </div>
  );
}
