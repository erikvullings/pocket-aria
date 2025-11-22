import m from "mithril";
import { Project } from "@/models/types";
import { getAllProjects, deleteProject } from "@/services/db";
import mainImage from "../assets/main.webp";
import { Button, IconButton, toast } from "mithril-materialized";
import { copyPermalinkToClipboard } from "@/utils/permalink";

interface LibraryState {
  projects: Project[];
  loading: boolean;
}

export const LibraryView: m.FactoryComponent = () => {
  let state: LibraryState = {
    projects: [],
    loading: true,
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

      return m(".library-view.container", [
        m("h1", "Library"),
        m(
          ".row",
          m(
            ".col.s12",
            m(Button, {
              label: "New Song",
              iconName: "add",
              onclick: () => m.route.set("/song/new"),
            })
          )
        ),
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
            : state.projects.map((project) =>
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
