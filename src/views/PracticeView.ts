import m from "mithril";
import { render } from "slimdown-js";
import { FlatButton } from "mithril-materialized";
import { Project, Lyrics, Score } from "../models/types";
import { getProject } from "../services/db";

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
}

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
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
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
    const renderContent = (content: string, format: string) => {
      switch (format) {
        case "html":
          return m.trust(content);
        case "markdown":
          return m.trust(render(content));
        case "text":
        default:
          const lines = content.split("\n");
          return lines.flatMap((line, idx) =>
            idx < lines.length - 1 ? [line || '\u00A0', m("br")] : [line || '\u00A0']
          );
      }
    };

    return m(
      ".lyrics-container",
      {
        style: `font-size: ${state.zoomLevel}em; padding: 20px; overflow-y: auto; height: calc(100vh - 120px); background: #1a1a1a; color: #ffffff;`,
      },
      [
        showTranslation && lyrics.translation
          ? m(
              ".row",
              {
                style: "margin: 0; max-width: 1200px; margin: 0 auto;",
              },
              [
                m(
                  ".col.s12.m6",
                  {
                    style: "line-height: 1.8;",
                  },
                  [
                    m(
                      "h4",
                      {
                        style:
                          "color: #888; font-size: 0.9em; margin-bottom: 10px;",
                      },
                      "Original"
                    ),
                    m(
                      ".lyrics-content",
                      renderContent(lyrics.content, lyrics.format)
                    ),
                  ]
                ),
                m(
                  ".col.s12.m6",
                  {
                    style: "line-height: 1.8;",
                  },
                  [
                    m(
                      "h4",
                      {
                        style:
                          "color: #888; font-size: 0.9em; margin-bottom: 10px;",
                      },
                      lyrics.translationLanguage
                        ? `Translation (${lyrics.translationLanguage})`
                        : "Translation"
                    ),
                    m(
                      ".lyrics-content",
                      {
                        style: "font-style: italic; color: #bbb;",
                      },
                      renderContent(lyrics.translation, lyrics.format)
                    ),
                  ]
                ),
              ]
            )
          : m(
              ".lyrics-content",
              {
                style: "max-width: 800px; margin: 0 auto; line-height: 1.8;",
              },
              renderContent(lyrics.content, lyrics.format)
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
          style: `height: calc(100vh - 120px); overflow: auto; padding: 10px; background: #1a1a1a;`,
          ontouchstart: handleTouchStart,
          ontouchend: handleTouchEnd,
        },
        [
          m("iframe", {
            src: url,
            style: `width: 100%; height: 100%; border: none; transform: scale(${state.zoomLevel}); transform-origin: top center;`,
          }),
        ]
      );
    } else if (score.type === "image") {
      return m(
        ".score-container",
        {
          style: `height: calc(100vh - 120px); overflow: auto; padding: 10px; text-align: center; background: #1a1a1a;`,
          ontouchstart: handleTouchStart,
          ontouchend: handleTouchEnd,
        },
        [
          m("img", {
            src: url,
            alt: "Score",
            style: `max-width: 100%; height: auto; transform: scale(${state.zoomLevel}); transform-origin: top center;`,
          }),
        ]
      );
    } else {
      // MusicXML - simplified rendering
      return m(
        ".score-container",
        {
          style: `height: calc(100vh - 120px); overflow: auto; padding: 10px; background: #1a1a1a;`,
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
    },

    onremove() {
      if (state.audio) {
        state.audio.pause();
        URL.revokeObjectURL(state.audio.src);
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

      return m(
        ".practice-view",
        {
          style:
            "position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #1a1a1a; z-index: 1000; color: #ffffff;",
        },
        [
          // Minimal header with controls
          m(
            ".practice-header",
            {
              style:
                "height: 60px; background: #212121; color: white; display: flex; align-items: center; padding: 0 15px; justify-content: space-between; border-bottom: 1px solid #333;",
            },
            [
              // Left side - Back button
              m(".left-controls", [
                m(FlatButton, {
                  iconName: "arrow_back",
                  className: "white-text",
                  style: "margin-right: 20px;",
                  onclick: () => m.route.set(`/song/${state.project!.id}`),
                }),
              ]),

              // Center - Audio controls
              hasAudio &&
                m(
                  ".audio-controls",
                  {
                    style:
                      "display: flex; flex-direction: row; align-items: center; gap: 8px; flex-shrink: 0;",
                  },
                  [
                    m(FlatButton, {
                      iconName: state.isPlaying ? "pause" : "play_arrow",
                      className: "white-text",
                      style: "min-width: 40px; padding: 0 8px;",
                      onclick: togglePlay,
                    }),
                    m(FlatButton, {
                      iconName: "stop",
                      className: "white-text",
                      style: "min-width: 40px; padding: 0 8px;",
                      onclick: stop,
                    }),
                    m(
                      "span",
                      {
                        style: "font-size: 13px; white-space: nowrap;",
                      },
                      `${formatTime(state.currentTime)} / ${formatTime(
                        state.duration
                      )}`
                    ),
                  ]
                ),

              // Right side - Zoom and toggle controls
              m(
                ".right-controls",
                {
                  style:
                    "display: flex; flex-direction: row; align-items: center; gap: 5px;",
                },
                [
                  m(FlatButton, {
                    iconName: "zoom_out",
                    className: "white-text",
                    title: "Zoom out",
                    onclick: zoomOut,
                  }),
                  m(
                    "span",
                    {
                      style:
                        "font-size: 13px; min-width: 45px; text-align: center;",
                    },
                    `${Math.round(state.zoomLevel * 100)}%`
                  ),
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
                ]
              ),
            ]
          ),

          // Content area
          m(
            ".practice-content",
            {
              style: "height: calc(100vh - 120px); overflow: hidden;",
            },
            [
              state.viewMode === "lyrics" && hasLyrics
                ? renderLyrics(state.project.lyrics!, false)
                : state.viewMode === "lyrics-translation" && hasLyrics
                ? renderLyrics(state.project.lyrics!, true)
                : state.viewMode === "score" &&
                  hasScores &&
                  state.project.scores[state.currentScorePage]
                ? renderScore(state.project.scores[state.currentScorePage])
                : m(
                    ".center-align",
                    {
                      style:
                        "padding: 40px; background: #1a1a1a; height: calc(100vh - 120px);",
                    },
                    [
                      m(
                        "p",
                        {
                          style: "color: #888;",
                        },
                        "No lyrics or scores available for this song"
                      ),
                    ]
                  ),
            ]
          ),

          // Score navigation footer (only show when viewing scores)
          state.viewMode === "score" &&
            hasScores &&
            state.project.scores.length > 1 &&
            m(
              ".practice-footer",
              {
                style:
                  "height: 60px; background: #212121; display: flex; align-items: center; justify-content: center; gap: 20px; border-top: 1px solid #333; color: white;",
              },
              [
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
              ]
            ),
        ]
      );
    },
  };
};
