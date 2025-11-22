import m from "mithril";
import { Button, TextArea, TextInput, RangeInput } from "mithril-materialized";
import { Playlist, PlaylistItem, Project } from "@/models/types";
import {
  savePlaylist,
  getPlaylist,
  generateId,
  getAllProjects,
} from "@/services/db";

interface PlaylistEditorState {
  playlist: Playlist;
  loading: boolean;
  isNew: boolean;
  availableProjects: Project[];
  selectedProjectIds: Set<string>;
  searchFilter: string;
}

export const PlaylistEditor: m.FactoryComponent = () => {
  let state: PlaylistEditorState = {
    playlist: {
      id: generateId(),
      name: "",
      items: [],
      pauseBetweenItems: 5,
      createdAt: Date.now(),
    },
    loading: false,
    isNew: true,
    availableProjects: [],
    selectedProjectIds: new Set(),
    searchFilter: "",
  };

  return {
    async oninit() {
      const playlistId = m.route.param("id");
      const isNew = playlistId === "new";

      // Load all projects
      state.availableProjects = await getAllProjects();

      if (isNew) {
        state.playlist = {
          id: generateId(),
          name: "",
          items: [],
          pauseBetweenItems: 5,
          createdAt: Date.now(),
        };
        state.isNew = true;
      } else {
        const existingPlaylist = await getPlaylist(playlistId);
        if (existingPlaylist) {
          state.playlist = existingPlaylist;
          state.selectedProjectIds = new Set(
            existingPlaylist.items.map((item) => item.projectId)
          );
        }
        state.isNew = false;
      }

      state.loading = false;
      m.redraw();
    },

    view() {
      const { playlist } = state;

      const handleSave = async () => {
        if (!playlist.name.trim()) {
          alert("Please enter a playlist name");
          return;
        }

        state.loading = true;
        try {
          await savePlaylist(playlist);
          m.route.set("/playlists");
        } catch (error) {
          alert(`Failed to save playlist: ${error}`);
          state.loading = false;
        }
      };

      const toggleProject = (projectId: string) => {
        if (state.selectedProjectIds.has(projectId)) {
          // Remove from playlist
          state.selectedProjectIds.delete(projectId);
          playlist.items = playlist.items.filter(
            (item) => item.projectId !== projectId
          );
        } else {
          // Add to playlist
          state.selectedProjectIds.add(projectId);
          const newItem: PlaylistItem = {
            projectId,
            order: playlist.items.length,
          };
          playlist.items.push(newItem);
        }
        m.redraw();
      };

      const moveUp = (index: number) => {
        if (index === 0) return;
        const items = playlist.items;
        [items[index - 1], items[index]] = [items[index], items[index - 1]];
        // Update order values
        items.forEach((item, idx) => (item.order = idx));
        m.redraw();
      };

      const moveDown = (index: number) => {
        if (index === playlist.items.length - 1) return;
        const items = playlist.items;
        [items[index], items[index + 1]] = [items[index + 1], items[index]];
        // Update order values
        items.forEach((item, idx) => (item.order = idx));
        m.redraw();
      };

      const removeFromPlaylist = (projectId: string) => {
        state.selectedProjectIds.delete(projectId);
        playlist.items = playlist.items.filter(
          (item) => item.projectId !== projectId
        );
        // Update order values
        playlist.items.forEach((item, idx) => (item.order = idx));
        m.redraw();
      };

      // Get project details for display
      const getProjectById = (id: string) =>
        state.availableProjects.find((p) => p.id === id);

      return m(".playlist-editor.container", [
        m("h1", state.isNew ? "New Playlist" : "Edit Playlist"),

        // Basic Information
        m(".row", [
          m(".col.s12", [
            m(".card", [
              m(".card-content.row", [
                m("span.card-title.col.s12", "Playlist Information"),

                m(TextInput, {
                  label: "Playlist Name",
                  value: playlist.name,
                  oninput: (name) => (playlist.name = name),
                  isMandatory: true,
                }),

                m(TextArea, {
                  label: "Description",
                  helperText: "Optional description of this playlist",
                  value: playlist.description || "",
                  oninput: (v: string) => {
                    playlist.description = v || undefined;
                  },
                }),

                m(RangeInput, {
                  label: `Pause Between Items: ${playlist.pauseBetweenItems} seconds`,
                  min: 0,
                  max: 30,
                  value: playlist.pauseBetweenItems,
                  oninput: (v) => (playlist.pauseBetweenItems = v),
                  valueDisplay: "none",
                }),
              ]),
            ]),
          ]),
        ]),

        // Current Playlist Items
        playlist.items.length > 0 &&
          m(".row", [
            m(".col.s12", [
              m(".card", [
                m(".card-content", [
                  m("span.card-title", "Playlist Order"),
                  m(
                    "ul.collection",
                    playlist.items.map((item, idx) => {
                      const project = getProjectById(item.projectId);
                      return m("li.collection-item", { key: item.projectId }, [
                        m(".row", { style: "margin-bottom: 0;" }, [
                          m(".col.s8", [
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
                              "a.btn-flat.btn-small",
                              {
                                onclick: () => moveUp(idx),
                                disabled: idx === 0,
                              },
                              [m("i.material-icons", "arrow_upward")]
                            ),
                            m(
                              "a.btn-flat.btn-small",
                              {
                                onclick: () => moveDown(idx),
                                disabled: idx === playlist.items.length - 1,
                              },
                              [m("i.material-icons", "arrow_downward")]
                            ),
                            m(
                              "a.btn-flat.btn-small.red-text",
                              {
                                onclick: () =>
                                  removeFromPlaylist(item.projectId),
                              },
                              [m("i.material-icons", "delete")]
                            ),
                          ]),
                        ]),
                      ]);
                    })
                  ),
                ]),
              ]),
            ]),
          ]),

        // Available Projects
        m(".row", [
          m(".col.s12", [
            m(".card", [
              m(".card-content", [
                m("span.card-title", "Available Songs"),
                m("p.grey-text", "Click to add/remove songs from the playlist"),

                // Search filter
                m(TextInput, {
                  label: "Search songs",
                  iconName: "search",
                  placeholder: "Filter by title or composer",
                  value: state.searchFilter,
                  oninput: (v) => {
                    state.searchFilter = v;
                  },
                }),

                state.availableProjects.length === 0
                  ? m("p", "No songs available. Create some songs first!")
                  : (() => {
                      // Filter projects based on search
                      const filteredProjects = state.availableProjects.filter(
                        (project) => {
                          if (!state.searchFilter) return true;
                          const searchLower = state.searchFilter.toLowerCase();
                          const titleMatch = project.metadata.title
                            ?.toLowerCase()
                            .includes(searchLower);
                          const composerMatch = project.metadata.composer
                            ?.toLowerCase()
                            .includes(searchLower);
                          const artistMatch = project.metadata.artist
                            ?.toLowerCase()
                            .includes(searchLower);
                          return titleMatch || composerMatch || artistMatch;
                        }
                      );

                      return filteredProjects.length === 0
                        ? m("p.grey-text", "No songs match your search")
                        : m(
                            "ul.collection",
                            filteredProjects.map((project) =>
                              m(
                                "li.collection-item",
                                {
                                  key: project.id,
                                  style: state.selectedProjectIds.has(
                                    project.id
                                  )
                                    ? "background-color: #e3f2fd;"
                                    : "",
                                  onclick: () => toggleProject(project.id),
                                },
                                [
                                  m(
                                    ".row",
                                    {
                                      style:
                                        "margin-bottom: 0; cursor: pointer;",
                                    },
                                    [
                                      m(".col.s10", [
                                        m("span.title", project.metadata.title),
                                        project.metadata.composer && m("br"),
                                        project.metadata.composer &&
                                          m(
                                            "span.grey-text.text-darken-1",
                                            project.metadata.composer
                                          ),
                                      ]),
                                      m(".col.s2.right-align", [
                                        state.selectedProjectIds.has(project.id)
                                          ? m(
                                              "i.material-icons.blue-text",
                                              "check_circle"
                                            )
                                          : m(
                                              "i.material-icons.grey-text",
                                              "radio_button_unchecked"
                                            ),
                                      ]),
                                    ]
                                  ),
                                ]
                              )
                            )
                          );
                    })(),
              ]),
            ]),
          ]),
        ]),

        // Actions
        m(".row", [
          m(".col.s12", [
            m(Button, {
              label: state.loading ? "Saving..." : "Save Playlist",
              iconName: "save",
              disabled: state.loading || !playlist.name.trim(),
              onclick: handleSave,
            }),
            " ",
            m(Button, {
              className: "grey",
              label: "Cancel",
              iconName: "cancel",
              disabled: state.loading,
              onclick: () => m.route.set("/playlists"),
            }),
          ]),
        ]),
      ]);
    },
  };
};
