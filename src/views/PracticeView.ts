import m from "mithril";
import { render } from "slimdown-js";
import { FlatButton } from "mithril-materialized";
import { Project, Lyrics, Score, Bookmark } from "../models/types";
import { getProject, saveProject, getSetting, saveSetting } from "../services/db";
import { parseLrcContent, getActiveLrcLine } from "../utils/lrc";
import { AudioControl } from "../components/AudioControl";

type ViewMode = "lyrics" | "lyrics-translation" | "score";

interface PracticeViewState {
  project: Project | null;
  loading: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  audio: HTMLAudioElement | null;
  zoomLevel: number;
  currentScorePage: number;
  viewMode: ViewMode;
  touchStartX: number;
  audioDevices: MediaDeviceInfo[];
  selectedAudioDevice: string;
  showDeviceSelector: boolean;
  offset: number;
}

const OFFSET_OPTIONS = [0, -1, -2, -3, -4, -5];

export const PracticeView: m.FactoryComponent = () => {
  let state: PracticeViewState = {
    project: null,
    loading: true,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    audio: null,
    zoomLevel: 1,
    currentScorePage: 0,
    viewMode: "lyrics",
    touchStartX: 0,
    audioDevices: [],
    selectedAudioDevice: "default",
    showDeviceSelector: false,
    offset: 0,
  };

  // Load offset from localStorage
  const loadOffset = () => {
    const stored = localStorage.getItem("practice-view-offset");
    if (stored !== null) {
      state.offset = parseInt(stored, 10);
    }
  };

  // Cycle through offset options
  const cycleOffset = () => {
    const currentIndex = OFFSET_OPTIONS.indexOf(state.offset);
    const nextIndex = (currentIndex + 1) % OFFSET_OPTIONS.length;
    state.offset = OFFSET_OPTIONS[nextIndex];
    localStorage.setItem("practice-view-offset", state.offset.toString());
    m.redraw();
  };

  // Jump to line timestamp with offset
  const jumpToLineTimestamp = (timestamp: number) => {
    if (state.audio) {
      const targetTime = Math.max(0, timestamp + state.offset);
      state.audio.currentTime = targetTime;
      state.currentTime = targetTime;
      if (!state.isPlaying) {
        state.audio.play();
        state.isPlaying = true;
      }
      m.redraw();
    }
  };

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

  const stop = () => {
    if (state.audio) {
      state.audio.pause();
      state.audio.currentTime = 0;
      state.isPlaying = false;
      state.currentTime = 0;
    }
  };

  const zoomIn = () => {
    state.zoomLevel = Math.min(state.zoomLevel + 0.2, 3);
  };

  const zoomOut = () => {
    state.zoomLevel = Math.max(state.zoomLevel - 0.2, 0.5);
  };

  const nextScorePage = () => {
    if (
      state.project &&
      state.currentScorePage < state.project.scores.length - 1
    ) {
      state.currentScorePage++;
    }
  };

  const prevScorePage = () => {
    if (state.currentScorePage > 0) {
      state.currentScorePage--;
    }
  };

  const handleTouchStart = (e: TouchEvent) => {
    state.touchStartX = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = state.touchStartX - touchEndX;

    // Swipe threshold: 50px
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swipe left - next page
        nextScorePage();
      } else {
        // Swipe right - previous page
        prevScorePage();
      }
    }
  };

  const addBookmark = async () => {
    if (!state.project || !state.audio || !state.isPlaying) return;

    const bookmark: Bookmark = {
      id: `bookmark-${Date.now()}`,
      timestamp: state.currentTime,
    };

    const bookmarks = state.project.bookmarks || [];
    state.project.bookmarks = [...bookmarks, bookmark].sort(
      (a, b) => a.timestamp - b.timestamp
    );

    await saveProject(state.project);
    m.redraw();
  };

  const deleteBookmark = async (bookmarkId: string) => {
    if (!state.project) return;

    state.project.bookmarks = (state.project.bookmarks || []).filter(
      (b) => b.id !== bookmarkId
    );

    await saveProject(state.project);
    m.redraw();
  };

  const jumpToBookmark = (timestamp: number) => {
    if (state.audio) {
      state.audio.currentTime = timestamp;
      if (!state.isPlaying) {
        state.audio.play();
        state.isPlaying = true;
      }
    }
  };

  const loadAudioDevices = async () => {
    try {
      // Request permission to enumerate devices
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const devices = await navigator.mediaDevices.enumerateDevices();
      state.audioDevices = devices.filter(
        (device) => device.kind === "audiooutput"
      );
      m.redraw();
    } catch (error) {
      console.error("Error enumerating audio devices:", error);
    }
  };

  const changeAudioDevice = async (deviceId: string) => {
    if (!state.audio) return;

    try {
      // Cast to any to access setSinkId which may not be in all TypeScript definitions
      const audioElement = state.audio as any;
      if (typeof audioElement.setSinkId === "function") {
        await audioElement.setSinkId(deviceId);
        state.selectedAudioDevice = deviceId;
        state.showDeviceSelector = false;
        // Save to IndexedDB
        await saveSetting("audioOutputDevice", deviceId);
        m.redraw();
      } else {
        console.warn("setSinkId is not supported in this browser");
      }
    } catch (error) {
      console.error("Error changing audio output device:", error);
    }
  };

  const toggleDeviceSelector = () => {
    state.showDeviceSelector = !state.showDeviceSelector;
    if (state.showDeviceSelector && state.audioDevices.length === 0) {
      loadAudioDevices();
    }
  };

  const cycleViewMode = () => {
    const hasLyrics = !!state.project?.lyrics;
    const hasTranslation = !!state.project?.lyrics?.translation;
    const hasScores = (state.project?.scores.length || 0) > 0;

    if (state.viewMode === "lyrics") {
      if (hasTranslation) {
        state.viewMode = "lyrics-translation";
      } else if (hasScores) {
        state.viewMode = "score";
        state.currentScorePage = 0;
      }
    } else if (state.viewMode === "lyrics-translation") {
      if (hasScores) {
        state.viewMode = "score";
        state.currentScorePage = 0;
      } else if (hasLyrics) {
        state.viewMode = "lyrics";
      }
    } else if (state.viewMode === "score") {
      if (hasLyrics) {
        state.viewMode = "lyrics";
      }
    }
  };

  const renderLyrics = (lyrics: Lyrics, showTranslation: boolean = false) => {
    // Parse LRC timestamps if available
    const hasTimestamps = lyrics.lrcTimestamps && lyrics.lrcTimestamps.length > 0;
    const { plainText: originalPlain, timestamps: parsedTimestamps } = parseLrcContent(lyrics.content);
    const timestamps = hasTimestamps ? lyrics.lrcTimestamps! : parsedTimestamps;

    // Get active line index based on current time
    const activeLineIndex = timestamps.length > 0 ? getActiveLrcLine(state.currentTime, timestamps) : -1;

    // Parse translation if available
    const translationPlain = lyrics.translation ? parseLrcContent(lyrics.translation).plainText : "";

    const renderContent = (content: string, format: string) => {
      // For text format with timestamps, render line by line with highlighting
      if (format === "text" && timestamps.length > 0) {
        const lines = content.split("\n");
        // Create a map for quick timestamp lookup
        const timestampMap = new Map<number, number>();
        timestamps.forEach((ts) => timestampMap.set(ts.lineIndex, ts.timestamp));

        return lines.map((line, idx) => {
          const isActive = idx === activeLineIndex;
          const lineTimestamp = timestampMap.get(idx);
          const hasTimestamp = lineTimestamp !== undefined;

          return m(
            "div.lyrics-line",
            {
              key: idx,
              class: [
                isActive ? "active-line" : "",
                hasTimestamp ? "clickable" : "",
              ].filter(Boolean).join(" "),
              onclick: hasTimestamp
                ? () => jumpToLineTimestamp(lineTimestamp)
                : undefined,
              style: hasTimestamp ? { cursor: "pointer" } : undefined,
            },
            line || "\u00A0"
          );
        });
      }

      switch (format) {
        case "html":
          return m.trust(content);
        case "markdown":
          return m.trust(render(content));
        case "text":
        default:
          const lines = content.split("\n");
          return lines.flatMap((line, idx) =>
            idx < lines.length - 1
              ? [line || "\u00A0", m("br")]
              : [line || "\u00A0"]
          );
      }
    };

    // Use plain text (without timestamps) for display
    const displayContent = timestamps.length > 0 ? originalPlain : lyrics.content;
    const displayTranslation = timestamps.length > 0 ? translationPlain : (lyrics.translation || "");

    return m(
      ".lyrics-container",
      {
        style: { fontSize: `${state.zoomLevel}em` },
      },
      [
        showTranslation && lyrics.translation
          ? m(".row.lyrics-row", [
              m(".col.s12.m6.lyrics-col", [
                m("h4.lyrics-heading", "Original"),
                m(
                  ".lyrics-content",
                  renderContent(displayContent, lyrics.format)
                ),
              ]),
              m(".col.s12.m6.lyrics-col", [
                m(
                  "h4.lyrics-heading",
                  lyrics.translationLanguage
                    ? `Translation (${lyrics.translationLanguage})`
                    : "Translation"
                ),
                m(
                  ".lyrics-content.lyrics-translation",
                  renderContent(displayTranslation, lyrics.format)
                ),
              ]),
            ])
          : m(
              ".lyrics-content.lyrics-single",
              renderContent(displayContent, lyrics.format)
            ),
      ]
    );
  };

  const renderScore = (score: Score) => {
    const url = URL.createObjectURL(score.blob);

    if (score.type === "pdf") {
      return m(
        ".score-container",
        {
          ontouchstart: handleTouchStart,
          ontouchend: handleTouchEnd,
        },
        [
          m("iframe", {
            src: url,
            style: {
              width: "100%",
              height: "100%",
              border: "none",
              transform: `scale(${state.zoomLevel})`,
              transformOrigin: "top center",
            },
          }),
        ]
      );
    } else if (score.type === "image") {
      return m(
        ".score-container-centered",
        {
          ontouchstart: handleTouchStart,
          ontouchend: handleTouchEnd,
        },
        [
          m("img", {
            src: url,
            alt: "Score",
            style: {
              maxWidth: "100%",
              height: "auto",
              transform: `scale(${state.zoomLevel})`,
              transformOrigin: "top center",
            },
          }),
        ]
      );
    } else {
      // MusicXML - simplified rendering
      return m(
        ".score-container",
        {
          ontouchstart: handleTouchStart,
          ontouchend: handleTouchEnd,
        },
        [
          m(".center-align", [
            m("p.grey-text", "MusicXML rendering not yet implemented"),
            m("p", "Score file: " + score.filename),
          ]),
        ]
      );
    }
  };

  return {
    async oninit() {
      loadOffset();

      const id = m.route.param("id");
      if (id) {
        const project = await getProject(id);
        state.project = project || null;
        state.loading = false;

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
            m.redraw();
          });

          audio.addEventListener("ended", () => {
            state.isPlaying = false;
            m.redraw();
          });
        }

        // Determine what to show first
        if (state.project?.lyrics) {
          state.viewMode = "lyrics";
        } else if (state.project?.scores && state.project.scores.length > 0) {
          state.viewMode = "score";
        }

        m.redraw();
      }

      // Add click handler to close device selector when clicking outside
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (
          state.showDeviceSelector &&
          !target.closest(".audio-device-selector-wrapper")
        ) {
          state.showDeviceSelector = false;
          m.redraw();
        }
      };
      document.addEventListener("click", handleClickOutside);

      // Store the handler for cleanup
      (this as any).handleClickOutside = handleClickOutside;
    },

    onremove() {
      if (state.audio) {
        state.audio.pause();
        URL.revokeObjectURL(state.audio.src);
      }

      // Remove click handler
      if ((this as any).handleClickOutside) {
        document.removeEventListener("click", (this as any).handleClickOutside);
      }
    },

    view() {
      if (state.loading || !state.project) {
        return m(".practice-view", [m(".progress", [m(".indeterminate")])]);
      }

      const hasLyrics = !!state.project.lyrics;
      const hasTranslation = !!state.project.lyrics?.translation;
      const hasScores = state.project.scores.length > 0;
      const hasAudio = !!state.project.audioTrack;
      const canToggleView =
        (hasLyrics && hasTranslation) ||
        (hasLyrics && hasScores) ||
        (hasTranslation && hasScores);

      const getViewModeIcon = () => {
        if (state.viewMode === "lyrics")
          return hasTranslation ? "translate" : "music_note";
        if (state.viewMode === "lyrics-translation")
          return hasScores ? "music_note" : "text_fields";
        return "text_fields";
      };

      const getViewModeTitle = () => {
        if (state.viewMode === "lyrics")
          return hasTranslation ? "Show translation" : "Show score";
        if (state.viewMode === "lyrics-translation")
          return hasScores ? "Show score" : "Show lyrics only";
        return "Show lyrics";
      };

      return m(".practice-view", [
        // Minimal header with controls
        m(".practice-header", [
          // Left side - Back button
          m(".left-controls", [
            m(FlatButton, {
              iconName: "arrow_back",
              className: "white-text back-button",
              onclick: () => m.route.set(`/song/${state.project!.id}`),
            }),
          ]),

          // Center - Audio controls using AudioControl component
          hasAudio &&
            m(AudioControl, {
              state: {
                isPlaying: state.isPlaying,
                currentTime: state.currentTime,
                duration: state.duration,
                audio: state.audio,
                audioDevices: state.audioDevices,
                selectedAudioDevice: state.selectedAudioDevice,
                showDeviceSelector: state.showDeviceSelector,
              },
              callbacks: {
                onTogglePlay: togglePlay,
                onStop: stop,
                onSeek: (time: number) => {
                  if (state.audio) {
                    state.audio.currentTime = time;
                    state.currentTime = time;
                  }
                },
                onAddBookmark: addBookmark,
                onChangeAudioDevice: changeAudioDevice,
                onToggleDeviceSelector: toggleDeviceSelector,
              },
              showSeekBar: true,
              showBookmarkButton: true,
            }),

          // Right side - Zoom and toggle controls
          m(".right-controls", [
            hasAudio &&
              m(FlatButton, {
                iconName: "schedule",
                className: "white-text",
                title: `Offset: ${state.offset >= 0 ? "+" : ""}${state.offset}s (click to cycle)`,
                onclick: cycleOffset,
              }),
            hasAudio &&
              m("span.offset-text", `${state.offset >= 0 ? "+" : ""}${state.offset}s`),
            m(FlatButton, {
              iconName: "zoom_out",
              className: "white-text",
              title: "Zoom out",
              onclick: zoomOut,
            }),
            m("span.zoom-text", `${Math.round(state.zoomLevel * 100)}%`),
            m(FlatButton, {
              iconName: "zoom_in",
              className: "white-text",
              title: "Zoom in",
              onclick: zoomIn,
            }),
            canToggleView &&
              m(FlatButton, {
                iconName: getViewModeIcon(),
                className: "white-text",
                title: getViewModeTitle(),
                onclick: cycleViewMode,
              }),
          ]),
        ]),

        // Bookmarks section
        hasAudio &&
          state.project.bookmarks &&
          state.project.bookmarks.length > 0 &&
          m(".bookmarks-container", [
            state.project.bookmarks.map((bookmark) =>
              m(".bookmark-item", { key: bookmark.id }, [
                m(
                  ".bookmark-timestamp",
                  {
                    onclick: () => jumpToBookmark(bookmark.timestamp),
                    title: "Jump to this position",
                  },
                  formatTime(bookmark.timestamp)
                ),
                m(
                  ".bookmark-delete",
                  {
                    onclick: () => deleteBookmark(bookmark.id),
                    title: "Delete bookmark",
                  },
                  m("i.material-icons", "close")
                ),
              ])
            ),
          ]),


        // Content area
        m(".practice-content", [
          state.viewMode === "lyrics" && hasLyrics
            ? renderLyrics(state.project.lyrics!, false)
            : state.viewMode === "lyrics-translation" && hasLyrics
            ? renderLyrics(state.project.lyrics!, true)
            : state.viewMode === "score" &&
              hasScores &&
              state.project.scores[state.currentScorePage]
            ? renderScore(state.project.scores[state.currentScorePage])
            : m(".center-align.practice-empty", [
                m(
                  "p.practice-empty-text",
                  "No lyrics or scores available for this song"
                ),
              ]),
        ]),

        // Score navigation footer (only show when viewing scores)
        state.viewMode === "score" &&
          hasScores &&
          state.project.scores.length > 1 &&
          m(".practice-footer", [
            m(
              "button.btn.waves-effect",
              {
                onclick: prevScorePage,
                disabled: state.currentScorePage === 0,
              },
              [m("i.material-icons", "chevron_left")]
            ),
            m(
              "span",
              `Page ${state.currentScorePage + 1} of ${
                state.project.scores.length
              }`
            ),
            m(
              "button.btn.waves-effect",
              {
                onclick: nextScorePage,
                disabled:
                  state.currentScorePage >= state.project.scores.length - 1,
              },
              [m("i.material-icons", "chevron_right")]
            ),
          ]),
      ]);
    },
  };
};
