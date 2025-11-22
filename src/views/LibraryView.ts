import m from "mithril";
import { Project } from "@/models/types";
import { getAllProjects, deleteProject } from "@/services/db";
import mainImage from "../assets/main.webp";
import { Button, IconButton, toast, Autocomplete } from "mithril-materialized";
import { copyPermalinkToClipboard } from "@/utils/permalink";

type SortOrder = "composer-title" | "title" | "recent";

interface LibraryState {
  projects: Project[];
  loading: boolean;
  sortOrder: SortOrder;
  composerFilter: string;
}

export const LibraryView: m.FactoryComponent = () => {
  let state: LibraryState = {
    projects: [],
    loading: true,
    sortOrder: "composer-title",
    composerFilter: "",
  };

  const sortProjects = (projects: Project[], order: SortOrder): Project[] => {
    const sorted = [...projects];
    switch (order) {
      case "composer-title":
        return sorted.sort((a, b) => {
          const composerA = a.metadata.composer?.toLowerCase() || "";
          const composerB = b.metadata.composer?.toLowerCase() || "";
          if (composerA !== composerB) {
            return composerA.localeCompare(composerB);
          }
          const titleA = a.metadata.title?.toLowerCase() || "";
          const titleB = b.metadata.title?.toLowerCase() || "";
          return titleA.localeCompare(titleB);
        });
      case "title":
        return sorted.sort((a, b) => {
          const titleA = a.metadata.title?.toLowerCase() || "";
          const titleB = b.metadata.title?.toLowerCase() || "";
          return titleA.localeCompare(titleB);
        });
      case "recent":
        return sorted.sort((a, b) => {
          const dateA = a.metadata.createdAt || 0;
          const dateB = b.metadata.createdAt || 0;
          return dateB - dateA; // Most recent first
        });
      default:
        return sorted;
    }
  };

  const setSortOrder = (order: SortOrder) => {
    state.sortOrder = order;
    m.redraw();
  };

  const getUniqueComposers = (projects: Project[]): Record<string, null> => {
    const composers: Record<string, null> = {};
    projects.forEach((project) => {
      if (project.metadata.composer) {
        composers[project.metadata.composer] = null;
      }
    });
    return composers;
  };

  const filterProjects = (projects: Project[]): Project[] => {
    if (!state.composerFilter) {
      return projects;
    }
    return projects.filter(
      (project) =>
        project.metadata.composer?.toLowerCase() ===
        state.composerFilter.toLowerCase()
    );
  };

  const handleComposerFilterChange = (value: string) => {
    state.composerFilter = value;
    m.redraw();
  };

  const clearComposerFilter = () => {
    state.composerFilter = "";
    m.redraw();
  };

  return {
    async oninit() {
      state.projects = await getAllProjects();
      state.loading = false;
      m.redraw();
    },

    view() {
      const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this project?")) {
          await deleteProject(id);
          state.projects = state.projects.filter((p) => p.id !== id);
          m.redraw();
        }
      };

      const filteredProjects = filterProjects(state.projects);
      const sortedProjects = sortProjects(filteredProjects, state.sortOrder);
      const composerData = getUniqueComposers(state.projects);

      return m(".library-view.container", [
        m(".row", { style: { alignItems: "center", marginBottom: "1rem" } }, [
          m(".col.s12.m6", [m("h1", { style: { margin: "0" } }, "Library")]),
          m(".col.s12.m6", [
            m(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                },
              },
              [
                m(
                  "div",
                  { style: { flex: "1" } },
                  m(Autocomplete, {
                    label: "Filter by Composer",
                    iconName: "person",
                    data: composerData,
                    value: state.composerFilter,
                    oninput: (value) => {
                      state.composerFilter = value;
                    },
                    onAutocomplete: handleComposerFilterChange,
                  })
                ),
                state.composerFilter &&
                  m(IconButton, {
                    iconName: "close",
                    title: "Clear filter",
                    onclick: clearComposerFilter,
                    className: "grey-text",
                    style: { marginTop: "1rem" },
                  }),
              ]
            ),
          ]),
        ]),
        m(".row", [
          m(".col.s12.m6", [
            m(Button, {
              label: "New Song",
              iconName: "add",
              onclick: () => m.route.set("/song/new"),
            }),
          ]),
          m(".col.s12.m6", [
            m(
              ".sort-buttons",
              {
                style: {
                  display: "flex",
                  gap: "0.5rem",
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                },
              },
              [
                m(Button, {
                  label: "Composer",
                  iconName: "person",
                  className:
                    state.sortOrder === "composer-title"
                      ? ""
                      : "grey lighten-2 grey-text",
                  onclick: () => setSortOrder("composer-title"),
                }),
                m(Button, {
                  label: "Title",
                  iconName: "sort_by_alpha",
                  className:
                    state.sortOrder === "title"
                      ? ""
                      : "grey lighten-2 grey-text",
                  onclick: () => setSortOrder("title"),
                }),
                m(Button, {
                  label: "Recent",
                  iconName: "schedule",
                  className:
                    state.sortOrder === "recent"
                      ? ""
                      : "grey lighten-2 grey-text",
                  onclick: () => setSortOrder("recent"),
                }),
              ]
            ),
          ]),
        ]),
        m(
          ".row",
          state.loading
            ? m(".progress", [m(".indeterminate")])
            : state.projects.length === 0
            ? m(".col.s12.center-align", [
                m("img.logo-large", {
                  src: mainImage,
                  alt: "PocketAria",
                }),
                m("h5.grey-text", "No songs in your library yet"),
                m("p.grey-text", 'Click "New Song" to add your first piece'),
              ])
            : sortedProjects.map((project) =>
                m(".col.s12.m6.l4", { key: project.id }, [
                  m(".card", [
                    m(
                      ".card-content.pointer",
                      {
                        onclick: () => m.route.set(`/song/${project.id}`),
                      },
                      [
                        m("span.card-title", project.metadata.title),
                        project.metadata.composer &&
                          m("p", `Composer: ${project.metadata.composer}`),
                        project.metadata.voiceType &&
                          m("p", `Voice: ${project.metadata.voiceType}`),
                        project.metadata.genre &&
                          m("p.grey-text", project.metadata.genre),
                      ]
                    ),
                    m(".card-action", [
                      m(IconButton, {
                        title: "Practice",
                        onclick: () =>
                          m.route.set(`/song/${project.id}/practice`),
                        iconName: "play_circle_outline",
                      }),
                      m(IconButton, {
                        title: "View",
                        onclick: () => m.route.set(`/song/${project.id}`),
                        iconName: "remove_red_eye",
                      }),
                      m(IconButton, {
                        title: "Edit",
                        onclick: () => m.route.set(`/song/${project.id}/edit`),
                        iconName: "edit",
                      }),
                      m(IconButton, {
                        title: "Share",
                        iconName: "share",
                        onclick: async () => {
                          try {
                            await copyPermalinkToClipboard(project);
                            toast({
                              html: `Permalink copied to clipboard! Share this link to import the song.`,
                            });
                          } catch (error) {
                            console.error(
                              "Failed to generate or copy permalink:",
                              error
                            );
                            toast({
                              html: "Failed to generate permalink. Please try again.",
                            });
                          }
                        },
                      }),
                      m(IconButton, {
                        title: "Delete",
                        onclick: () => handleDelete(project.id),
                        iconName: "delete",
                        className: "red-text",
                      }),
                    ]),
                  ]),
                ])
              )
        ),
      ]);
    },
  };
};
