import m from "mithril";
import { AudioTrack } from "@/models/types";

export interface AudioPlayerAttrs {
  audioTrack: AudioTrack;
  onTimeUpdate?: (currentTime: number) => void;
  onEnded?: () => void;
}

interface AudioPlayerState {
  audio: HTMLAudioElement | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  replay: boolean;
}

export const AudioPlayer: m.FactoryComponent<AudioPlayerAttrs> = () => {
  let state: AudioPlayerState = {
    audio: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    replay: false,
  };

  return {
    oncreate(vnode) {
      const audio = document.getElementById("audio-player") as HTMLAudioElement;
      state.audio = audio;

      // Load audio track
      const url = URL.createObjectURL(vnode.attrs.audioTrack.blob);
      audio.src = url;

      // Event listeners
      audio.addEventListener("loadedmetadata", () => {
        state.duration = audio.duration;
        m.redraw();
      });

      audio.addEventListener("timeupdate", () => {
        state.currentTime = audio.currentTime;
        if (vnode.attrs.onTimeUpdate) {
          vnode.attrs.onTimeUpdate(audio.currentTime);
        }
        m.redraw();
      });

      audio.addEventListener("ended", () => {
        if (state.replay) {
          audio.currentTime = 0;
          audio.play();
        } else {
          state.isPlaying = false;
          if (vnode.attrs.onEnded) {
            vnode.attrs.onEnded();
          }
          m.redraw();
        }
      });
    },

    onremove() {
      if (state.audio) {
        state.audio.pause();
        URL.revokeObjectURL(state.audio.src);
      }
    },

    view() {
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

      const handleSeek = (e: Event) => {
        const input = e.target as HTMLInputElement;
        const time = parseFloat(input.value);
        if (state.audio) {
          state.audio.currentTime = time;
          state.currentTime = time;
        }
      };

      const toggleReplay = () => {
        state.replay = !state.replay;
      };

      const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
      };

      return m(".audio-player", [
        m("audio#audio-player"),
        m(".audio-controls", [
          m(".playback-controls", [
            m(
              "button.btn.waves-effect.waves-light",
              {
                onclick: togglePlay,
              },
              [m("i.material-icons", state.isPlaying ? "pause" : "play_arrow")]
            ),
            m(
              "button.btn.waves-effect.waves-light",
              {
                onclick: toggleReplay,
                class: state.replay ? "blue" : "grey",
              },
              [m("i.material-icons", "replay")]
            ),
            m(".time-display", [
              m("span", formatTime(state.currentTime)),
              m("span", " / "),
              m("span", formatTime(state.duration)),
            ]),
          ]),
          m(".seek-bar", [
            m("input[type=range]", {
              min: 0,
              max: state.duration || 0,
              value: state.currentTime,
              step: 0.1,
              oninput: handleSeek,
            }),
          ]),
        ]),
      ]);
    },
  };
};
