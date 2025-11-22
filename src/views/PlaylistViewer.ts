import m from "mithril";
import { Button } from "mithril-materialized";
import { Playlist, Project } from "@/models/types";
import { getPlaylist, getProject } from "@/services/db";

interface PlaylistViewerState {
  playlist: Playlist | null;
  projects: Map<string, Project>;
  currentIndex: number;
  isPlaying: boolean;
  loading: boolean;
  isPaused: boolean;
  pauseTimeRemaining: number;
  pauseIntervalId: number | null;
}

export const PlaylistViewer: m.FactoryComponent = () => {
  let state: PlaylistViewerState = {
    playlist: null,
    projects: new Map(),
    currentIndex: 0,
    isPlaying: false,
    loading: true,
    isPaused: false,
    pauseTimeRemaining: 0,
    pauseIntervalId: null,
  };

  const loadPlaylist = async () => {
    const playlistId = m.route.param("id");
    const playlist = await getPlaylist(playlistId);

    if (!playlist) {
      state.loading = false;
      m.redraw();
      return;
    }

    state.playlist = playlist;

    // Load all projects in the playlist
    const projectsMap = new Map<string, Project>();
    for (const item of playlist.items) {
      const project = await getProject(item.projectId);
      if (project) {
        projectsMap.set(item.projectId, project);
      }
    }

    state.projects = projectsMap;
    state.loading = false;
    m.redraw();
  };

  const getCurrentProject = (): Project | undefined => {
    if (!state.playlist || state.currentIndex >= state.playlist.items.length) {
      return undefined;
    }
    const projectId = state.playlist.items[state.currentIndex].projectId;
    return state.projects.get(projectId);
  };

  const goToSong = (index: number) => {
    if (state.pauseIntervalId) {
      clearInterval(state.pauseIntervalId);
      state.pauseIntervalId = null;
    }
    state.currentIndex = index;
    state.isPaused = false;
    state.pauseTimeRemaining = 0;
    const project = getCurrentProject();
    if (project) {
      m.route.set(`/song/${project.id}/practice`);
    }
  };

  const playPlaylist = () => {
    state.isPlaying = true;
    state.currentIndex = 0;
    goToSong(0);
  };

  const startPause = () => {
    if (!state.playlist) return;

    state.isPaused = true;
    state.pauseTimeRemaining = state.playlist.pauseBetweenItems;

    if (state.playlist.pauseBetweenItems === 0) {
      // No pause, go directly to next song
      goToNext();
      return;
    }

    // Countdown the pause
    state.pauseIntervalId = window.setInterval(() => {
      state.pauseTimeRemaining -= 1;
      if (state.pauseTimeRemaining <= 0) {
        if (state.pauseIntervalId) {
          clearInterval(state.pauseIntervalId);
          state.pauseIntervalId = null;
        }
        goToNext();
      }
      m.redraw();
    }, 1000);
  };

  const goToNext = () => {
    if (!state.playlist) return;

    if (state.currentIndex < state.playlist.items.length - 1) {
      state.currentIndex += 1;
      goToSong(state.currentIndex);
    } else {
      // End of playlist
      state.isPlaying = false;
      state.isPaused = false;
      m.redraw();
    }
  };

  const goToPrevious = () => {
    if (state.currentIndex > 0) {
      state.currentIndex -= 1;
      goToSong(state.currentIndex);
    }
  };

  return {
    async oninit() {
      await loadPlaylist();
    },

    onremove() {
      // Clean up interval on component removal
      if (state.pauseIntervalId) {
        clearInterval(state.pauseIntervalId);
      }
    },

    view() {
      if (state.loading) {
        return m(".playlist-viewer.container", [
          m("h1", "Loading..."),
          m(".progress", [m(".indeterminate")]),
        ]);
      }

      if (!state.playlist) {
        return m(".playlist-viewer.container", [
          m("h1", "Playlist Not Found"),
          m("p", "The requested playlist could not be found."),
          m(Button, {
            label: "Back to Playlists",
            iconName: "arrow_back",
            onclick: () => m.route.set("/playlists"),
          }),
        ]);
      }

      const currentProject = getCurrentProject();

      return m(".playlist-viewer.container", [
        // Header
        m(".row", [
          m(".col.s12", [
            m("h1", state.playlist.name),
            state.playlist.description &&
              m("p.grey-text", state.playlist.description),
            m("p", [
              m("i.material-icons.tiny", { style: "vertical-align: middle;" }, "music_note"),
              ` ${state.playlist.items.length} song(s)`,
              state.playlist.pauseBetweenItems > 0 &&
                ` • ${state.playlist.pauseBetweenItems}s pause between items`,
            ]),
          ]),
        ]),

        // Actions
        m(".row", [
          m(".col.s12", [
            m(Button, {
              label: "Play Playlist",
              iconName: "play_arrow",
              onclick: playPlaylist,
            }),
            " ",
            m(Button, {
              className: "grey",
              label: "Edit",
              iconName: "edit",
              onclick: () =>
                m.route.set(`/playlist/${state.playlist!.id}/edit`),
            }),
            " ",
            m(Button, {
              className: "grey",
              label: "Back",
              iconName: "arrow_back",
              onclick: () => m.route.set("/playlists"),
            }),
          ]),
        ]),

        // Pause indicator (if paused between songs)
        state.isPaused &&
          m(".row", [
            m(".col.s12", [
              m(".card.blue.lighten-4", [
                m(".card-content", [
                  m("p.center-align", [
                    m("i.material-icons", { style: "vertical-align: middle;" }, "pause_circle"),
                    ` Pausing for ${state.pauseTimeRemaining} second(s)...`,
                  ]),
                ]),
              ]),
            ]),
          ]),

        // Current song indicator (if playing)
        state.isPlaying &&
          currentProject &&
          m(".row", [
            m(".col.s12", [
              m(".card.green.lighten-4", [
                m(".card-content", [
                  m("span.card-title", "Now Playing"),
                  m("p", [
                    m("strong", currentProject.metadata.title),
                    currentProject.metadata.composer &&
                      m("span", ` by ${currentProject.metadata.composer}`),
                  ]),
                  m("p.grey-text", `Song ${state.currentIndex + 1} of ${state.playlist.items.length}`),
                ]),
                m(".card-action", [
                  m(
                    "a",
                    {
                      onclick: goToPrevious,
                      class: state.currentIndex === 0 ? "disabled" : "",
                    },
                    [
                      m("i.material-icons.left", "skip_previous"),
                      "Previous",
                    ]
                  ),
                  m(
                    "a",
                    {
                      onclick: goToNext,
                      class:
                        state.currentIndex === state.playlist.items.length - 1
                          ? "disabled"
                          : "",
                    },
                    [
                      m("i.material-icons.left", "skip_next"),
                      "Next",
                    ]
                  ),
                ]),
              ]),
            ]),
          ]),

        // Playlist items
        m(".row", [
          m(".col.s12", [
            m(".card", [
              m(".card-content", [
                m("span.card-title", "Songs"),
                state.playlist.items.length === 0
                  ? m("p", "This playlist is empty.")
                  : m(
                      "ul.collection",
                      state.playlist.items.map((item, idx) => {
                        const project = state.projects.get(item.projectId);
                        const isCurrent =
                          state.isPlaying && idx === state.currentIndex;

                        return m(
                          "li.collection-item",
                          {
                            key: item.projectId,
                            class: isCurrent ? "active blue lighten-5" : "",
                          },
                          [
                            m(".row", { style: "margin-bottom: 0;" }, [
                              m(".col.s1", [
                                m(
                                  "span.grey-text",
                                  isCurrent
                                    ? m("i.material-icons.blue-text", "play_arrow")
                                    : `${idx + 1}.`
                                ),
                              ]),
                              m(".col.s7", [
                                m(
                                  "span.title",
                                  project?.metadata.title || "Unknown"
                                ),
                                project?.metadata.composer && m("br"),
                                project?.metadata.composer &&
                                  m(
                                    "span.grey-text.text-darken-1",
                                    project.metadata.composer
                                  ),
                              ]),
                              m(".col.s4.right-align", [
                                m(
                                  "a",
                                  {
                                    onclick: () => goToSong(idx),
                                  },
                                  "Play"
                                ),
                                " ",
                                m(
                                  "a",
                                  {
                                    href: `#!/song/${item.projectId}`,
                                  },
                                  "View"
                                ),
                              ]),
                            ]),
                          ]
                        );
                      })
                    ),
              ]),
            ]),
          ]),
        ]),
      ]);
    },
  };
};
