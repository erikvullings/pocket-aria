import m from "mithril";
import { FlatButton } from "mithril-materialized";
import { Project, LrcTimestamp } from "../models/types";
import {
  getProject,
  saveProject,
  getSetting,
  saveSetting,
} from "../services/db";
import { formatLrcTimestamp } from "../utils/lrc";
import {
  AudioControl,
  AudioControlState,
  AudioControlCallbacks,
} from "../components/AudioControl";

interface LrcEditorState {
  project: Project | null;
  loading: boolean;
  lines: string[];
  timestamps: Map<number, number>;
  activeLineIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  audio: HTMLAudioElement | null;
  offset: number;
  seekValue: number;
  audioDevices: MediaDeviceInfo[];
  selectedAudioDevice: string;
  showDeviceSelector: boolean;
  saveStatus: "saved" | "saving" | "unsaved";
}

export const LrcEditorView: m.FactoryComponent = () => {
  let state: LrcEditorState = {
    project: null,
    loading: true,
    lines: [],
    timestamps: new Map(),
    activeLineIndex: 0,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    audio: null,
    offset: 0,
    seekValue: 0,
    audioDevices: [],
    selectedAudioDevice: "default",
    showDeviceSelector: false,
    saveStatus: "saved",
  };

  // Load offset from localStorage
  const loadOffset = () => {
    const stored = localStorage.getItem("lrc-editor-offset");
    if (stored !== null) {
      state.offset = parseInt(stored, 10);
    }
  };

  // Save timestamps to project
  const saveTimestamps = async () => {
    if (!state.project || !state.project.lyrics) return;

    state.saveStatus = "saving";
    m.redraw();

    const lrcTimestamps: LrcTimestamp[] = Array.from(state.timestamps.entries())
      .filter(([_, timestamp]) => timestamp !== undefined)
      .map(([lineIndex, timestamp]) => ({ lineIndex, timestamp }));

    state.project.lyrics.lrcTimestamps = lrcTimestamps;
    await saveProject(state.project);

    state.saveStatus = "saved";
    m.redraw();
  };

  // Manual save (triggered by button)
  const manualSave = async () => {
    await saveTimestamps();
  };

  // Load audio devices
  const loadAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      state.audioDevices = devices.filter((d) => d.kind === "audiooutput");
      m.redraw();
    } catch (error) {
      console.error("Error loading audio devices:", error);
    }
  };

  // Change audio device
  const changeAudioDevice = async (deviceId: string) => {
    if (state.audio && (state.audio as any).setSinkId) {
      try {
        await (state.audio as any).setSinkId(deviceId);
        state.selectedAudioDevice = deviceId;
        state.showDeviceSelector = false;
        // Save to IndexedDB
        await saveSetting("audioOutputDevice", deviceId);
        m.redraw();
      } catch (error) {
        console.error("Error changing audio device:", error);
      }
    }
  };

  // Toggle device selector
  const toggleDeviceSelector = () => {
    state.showDeviceSelector = !state.showDeviceSelector;
    if (state.showDeviceSelector && state.audioDevices.length === 0) {
      loadAudioDevices();
    }
  };

  // Check if line is empty
  const isEmptyLine = (lineIndex: number): boolean => {
    return !state.lines[lineIndex] || state.lines[lineIndex].trim() === "";
  };

  // Set timestamp for current line
  const setTimestamp = async () => {
    if (!state.audio) return;

    const timestamp = Math.floor(state.currentTime);
    state.timestamps.set(state.activeLineIndex, timestamp);

    await saveTimestamps();

    // Move to next non-empty line
    let nextIndex = state.activeLineIndex + 1;
    while (nextIndex < state.lines.length && isEmptyLine(nextIndex)) {
      nextIndex++;
    }
    if (nextIndex < state.lines.length) {
      state.activeLineIndex = nextIndex;
    }

    m.redraw();
  };

  // Move to previous line
  const moveToPreviousLine = () => {
    if (state.activeLineIndex > 0) {
      // Move to previous non-empty line
      let prevIndex = state.activeLineIndex - 1;
      while (prevIndex >= 0 && isEmptyLine(prevIndex)) {
        prevIndex--;
      }

      if (prevIndex >= 0) {
        state.activeLineIndex = prevIndex;

        // If previous line has a timestamp, seek to it
        const timestamp = state.timestamps.get(state.activeLineIndex);
        if (timestamp !== undefined && state.audio) {
          state.audio.currentTime = timestamp;
          if (!state.isPlaying) {
            state.audio.play();
            state.isPlaying = true;
          }
        }
      }

      m.redraw();
    }
  };

  // Move to next line
  const moveToNextLine = () => {
    if (state.activeLineIndex < state.lines.length - 1) {
      // Move to next non-empty line
      let nextIndex = state.activeLineIndex + 1;
      while (nextIndex < state.lines.length && isEmptyLine(nextIndex)) {
        nextIndex++;
      }
      if (nextIndex < state.lines.length) {
        state.activeLineIndex = nextIndex;
      }
      m.redraw();
    }
  };

  // Adjust timestamp (left/right arrows)
  const adjustTimestamp = async (delta: number) => {
    const currentTimestamp = state.timestamps.get(state.activeLineIndex);
    if (currentTimestamp !== undefined) {
      const newTimestamp = Math.max(0, currentTimestamp + delta);
      state.timestamps.set(state.activeLineIndex, newTimestamp);

      await saveTimestamps();

      // Seek audio to new position
      if (state.audio) {
        state.audio.currentTime = newTimestamp;
        if (!state.isPlaying) {
          state.audio.play();
          state.isPlaying = true;
        }
      }

      m.redraw();
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    if (state.audio) {
      if (state.isPlaying) {
        state.audio.pause();
      } else {
        state.audio.play();
      }
      state.isPlaying = !state.isPlaying;
    }
  };

  // Stop playback
  const stop = () => {
    if (state.audio) {
      state.audio.pause();
      state.audio.currentTime = 0;
      state.isPlaying = false;
      state.currentTime = 0;
      state.seekValue = 0;
    }
  };

  // Handle seek from audio control
  const handleSeek = (time: number) => {
    if (state.audio) {
      state.audio.currentTime = time;
      state.currentTime = time;
      state.seekValue = time;
    }
  };

  // Jump to line with offset
  const jumpToLine = (lineIndex: number) => {
    const timestamp = state.timestamps.get(lineIndex);
    if (timestamp !== undefined && state.audio) {
      const targetTime = Math.max(0, timestamp + state.offset);
      state.audio.currentTime = targetTime;
      if (!state.isPlaying) {
        state.audio.play();
        state.isPlaying = true;
      }
      state.activeLineIndex = lineIndex;
      m.redraw();
    }
  };

  // Reset timestamp for current line
  const resetTimestamp = async () => {
    const currentTimestamp = state.timestamps.get(state.activeLineIndex);
    if (currentTimestamp !== undefined) {
      state.timestamps.delete(state.activeLineIndex);
      await saveTimestamps();
      m.redraw();
    }
  };

  // Keyboard handler
  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case " ": // Space
      case "Enter":
        e.preventDefault();
        setTimestamp();
        break;
      case "ArrowUp":
        e.preventDefault();
        moveToPreviousLine();
        break;
      case "ArrowDown":
        e.preventDefault();
        moveToNextLine();
        break;
      case "ArrowLeft":
        e.preventDefault();
        adjustTimestamp(-0.25);
        break;
      case "ArrowRight":
        e.preventDefault();
        adjustTimestamp(0.25);
        break;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        resetTimestamp();
        break;
    }
  };

  return {
    async oninit() {
      const id = m.route.param("id");
      if (id) {
        const project = await getProject(id);
        state.project = project || null;
        state.loading = false;

        if (state.project?.lyrics) {
          // Split lyrics into lines
          state.lines = state.project.lyrics.content.split("\n");

          // Load existing timestamps
          if (state.project.lyrics.lrcTimestamps) {
            state.project.lyrics.lrcTimestamps.forEach((ts) => {
              state.timestamps.set(ts.lineIndex, ts.timestamp);
            });
          }

          // Initialize audio if available
          if (state.project?.audioTrack) {
            const audio = new Audio();
            const url = URL.createObjectURL(state.project.audioTrack.blob);
            audio.src = url;
            state.audio = audio;

            // Load saved audio output device
            const savedDevice = await getSetting<string>("audioOutputDevice");
            if (savedDevice) {
              state.selectedAudioDevice = savedDevice;
              const audioElement = audio as any;
              if (typeof audioElement.setSinkId === "function") {
                try {
                  await audioElement.setSinkId(savedDevice);
                } catch (error) {
                  console.warn("Could not restore audio device:", error);
                }
              }
            }

            audio.addEventListener("loadedmetadata", () => {
              state.duration = audio.duration;
              m.redraw();
            });

            audio.addEventListener("timeupdate", () => {
              state.currentTime = audio.currentTime;
              state.seekValue = audio.currentTime;
              m.redraw();
            });

            audio.addEventListener("ended", () => {
              state.isPlaying = false;
              m.redraw();
            });
          }
        }

        loadOffset();
        m.redraw();
      }

      // Add keyboard listener
      document.addEventListener("keydown", handleKeyDown);
    },

    onremove() {
      if (state.audio) {
        state.audio.pause();
        URL.revokeObjectURL(state.audio.src);
      }

      // Remove keyboard listener
      document.removeEventListener("keydown", handleKeyDown);
    },

    view() {
      if (state.loading || !state.project) {
        return m(".lrc-editor-view", [m(".progress", [m(".indeterminate")])]);
      }

      if (!state.project.audioTrack) {
        return m(".lrc-editor-view", [
          m(".center-align", [
            m("h4", "No Audio Track"),
            m("p", "This project needs an audio track to add timestamps."),
            m(FlatButton, {
              iconName: "arrow_back",
              label: "Back",
              onclick: () => m.route.set(`/song/${state.project!.id}`),
            }),
          ]),
        ]);
      }

      if (!state.project.lyrics) {
        return m(".lrc-editor-view", [
          m(".center-align", [
            m("h4", "No Lyrics"),
            m("p", "This project needs lyrics to add timestamps."),
            m(FlatButton, {
              iconName: "arrow_back",
              label: "Back",
              onclick: () => m.route.set(`/song/${state.project!.id}`),
            }),
          ]),
        ]);
      }

      const audioControlState: AudioControlState = {
        isPlaying: state.isPlaying,
        currentTime: state.currentTime,
        duration: state.duration,
        audio: state.audio,
        audioDevices: state.audioDevices,
        selectedAudioDevice: state.selectedAudioDevice,
        showDeviceSelector: state.showDeviceSelector,
      };

      const audioControlCallbacks: AudioControlCallbacks = {
        onTogglePlay: togglePlay,
        onStop: stop,
        onSeek: handleSeek,
        onChangeAudioDevice: changeAudioDevice,
        onToggleDeviceSelector: toggleDeviceSelector,
      };

      return m(".lrc-editor-view.container", [
        // Fixed header container
        m(".lrc-editor-fixed-header", [
          // Top header with back button and title
          m(".lrc-editor-header", [
            m(FlatButton, {
              iconName: "arrow_back",
              className: "white-text",
              onclick: () => m.route.set(`/song/${state.project!.id}`),
            }),
            m("h5.lrc-editor-title", "Timestamp Editor"),
            m(".lrc-editor-header-actions", [
              m(FlatButton, {
                iconName: "save",
                label:
                  state.saveStatus === "saving"
                    ? "Saving..."
                    : state.saveStatus === "saved"
                    ? "Saved"
                    : "Save",
                className: "white-text save-button",
                disabled: state.saveStatus === "saving",
                onclick: manualSave,
              }),
            ]),
          ]),

          // Audio control component
          m(AudioControl, {
            state: audioControlState,
            callbacks: audioControlCallbacks,
            showSeekBar: true,
          }),

          // Mobile control buttons
          m(".lrc-editor-mobile-controls", [
            m(FlatButton, {
              iconName: "space_bar",
              label: "Set Time",
              onclick: setTimestamp,
            }),
            m(FlatButton, {
              iconName: "arrow_circle_up",
              label: "Previous",
              onclick: moveToPreviousLine,
            }),
            m(FlatButton, {
              iconName: "arrow_circle_down",
              label: "Next",
              onclick: moveToNextLine,
            }),
            m(FlatButton, {
              iconName: "arrow_circle_left",
              label: "-0.25s",
              onclick: () => adjustTimestamp(-0.25),
            }),
            m(FlatButton, {
              iconName: "arrow_circle_right",
              label: "+0.25s",
              onclick: () => adjustTimestamp(0.25),
            }),
          ]),
        ]),

        // Lyrics editor (scrollable content)
        m(".lrc-editor-content", [
          state.lines.map((line, index) => {
            const isEmpty = isEmptyLine(index);
            const timestamp = state.timestamps.get(index);
            const isActive = index === state.activeLineIndex;
            const hasTimestamp = timestamp !== undefined;

            // For empty lines, just show the empty line without timestamp input
            if (isEmpty) {
              return m(
                ".lrc-editor-line.empty-line.row",
                {
                  key: index,
                },
                [m("span.lrc-line-text.col.s12", "\u00A0")]
              );
            }

            return m(
              ".lrc-editor-line.row",
              {
                key: index,
                class: isActive ? "active" : "",
                onclick: () => {
                  if (hasTimestamp) {
                    jumpToLine(index);
                  } else {
                    state.activeLineIndex = index;
                    m.redraw();
                  }
                },
              },
              [
                m("input.lrc-timestamp-input.col.s4.m3.l2", {
                  type: "text",
                  value: hasTimestamp ? formatLrcTimestamp(timestamp) : "",
                  readonly: true,
                  placeholder: "[00:00.00]",
                }),
                m("span.lrc-line-text.col.s8.m9.l10", line),
              ]
            );
          }),
        ]),
      ]);
    },
  };
};
