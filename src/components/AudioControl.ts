import m from "mithril";
import { FlatButton } from "mithril-materialized";

export interface AudioControlState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  audio: HTMLAudioElement | null;
  audioDevices: MediaDeviceInfo[];
  selectedAudioDevice: string;
  showDeviceSelector: boolean;
}

export interface AudioControlCallbacks {
  onTogglePlay: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  onAddBookmark?: () => void;
  onChangeAudioDevice: (deviceId: string) => void;
  onToggleDeviceSelector: () => void;
}

export interface AudioControlAttrs {
  state: AudioControlState;
  callbacks: AudioControlCallbacks;
  showSeekBar?: boolean;
  showBookmarkButton?: boolean;
  className?: string;
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const AudioControl: m.Component<AudioControlAttrs> = {
  view({ attrs }) {
    const { state, callbacks, showSeekBar = false, showBookmarkButton = false, className = "" } = attrs;

    const handleSeek = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const time = parseFloat(target.value);
      callbacks.onSeek(time);
    };

    const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

    return m(`.audio-control-container${className ? "." + className : ""}`, [
      // Main controls with integrated seek bar
      m(".audio-control-main", [
        m(FlatButton, {
          iconName: state.isPlaying ? "pause" : "play_arrow",
          className: "white-text control-button",
          onclick: callbacks.onTogglePlay,
        }),
        m(FlatButton, {
          iconName: "stop",
          className: "white-text control-button",
          onclick: callbacks.onStop,
        }),
        showBookmarkButton &&
          callbacks.onAddBookmark &&
          m(FlatButton, {
            iconName: "bookmark_add",
            className: "white-text control-button",
            title: "Add bookmark",
            disabled: !state.isPlaying,
            onclick: callbacks.onAddBookmark,
          }),
        // Integrated seek bar (responsive)
        showSeekBar &&
          m(".audio-control-seekbar-wrapper", [
            m("input.audio-control-seekbar", {
              type: "range",
              min: 0,
              max: state.duration || 100,
              step: 0.1,
              value: state.currentTime,
              oninput: handleSeek,
              style: `--progress: ${progress}%`,
            }),
          ]),
        m(
          "span.time-text",
          `${formatTime(state.currentTime)} / ${formatTime(state.duration)}`
        ),
        m(".audio-device-selector-wrapper", [
          m(FlatButton, {
            iconName: "volume_up",
            className: "white-text",
            title: "Select audio output device",
            onclick: callbacks.onToggleDeviceSelector,
          }),
          state.showDeviceSelector &&
            m(".audio-device-dropdown", [
              m("div.audio-device-header", "Audio Output"),
              state.audioDevices.length === 0
                ? m("div.audio-device-loading", "Loading devices...")
                : state.audioDevices.map((device) =>
                    m(
                      "div.audio-device-item",
                      {
                        class: device.deviceId === state.selectedAudioDevice ? "selected" : "",
                        onclick: () => callbacks.onChangeAudioDevice(device.deviceId),
                      },
                      [
                        m("i.material-icons", "volume_up"),
                        m("span", device.label || `Device ${device.deviceId.substring(0, 8)}`),
                        device.deviceId === state.selectedAudioDevice &&
                          m("i.material-icons.check-icon", "check"),
                      ]
                    )
                  ),
            ]),
        ]),
      ]),
    ]);
  },
};
