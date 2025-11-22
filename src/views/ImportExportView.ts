import m from "mithril";
import {
  getAllProjects,
  getAllPlaylists,
  saveProject,
  savePlaylist,
} from "@/services/db";
import {
  exportAllToJSON,
  exportProjectToJSON,
  importAllFromJSON,
  parsePermalink,
  downloadFile,
  readFile,
} from "@/services/import-export";
import { getProject } from "@/services/db";
import { FlatButton, TextArea, SearchSelect } from "mithril-materialized";
import { Project } from "@/models/types";
import { copyPermalinkToClipboard } from "@/utils/permalink";

interface ImportExportState {
  loading: boolean;
  permalink: string;
  importPermalink: string;
  message: string;
  selectedProjectId: string;
  projects: Project[];
}

export const ImportExportView: m.FactoryComponent = () => {
  let state: ImportExportState = {
    loading: false,
    permalink: "",
    importPermalink: "",
    message: "",
    selectedProjectId: "",
    projects: [],
  };

  const loadProjects = async () => {
    state.projects = await getAllProjects();
    m.redraw();
  };

  return {
    oninit() {
      loadProjects();
    },
    view() {
      const handleExportAll = async () => {
        state.loading = true;
        try {
          const projects = await getAllProjects();
          const playlists = await getAllPlaylists();
          const json = await exportAllToJSON(projects, playlists);
          downloadFile(json, `pocketaria-export-${Date.now()}.json`);
          state.message = "Export successful!";
        } catch (error) {
          state.message = `Export failed: ${error}`;
        }
        state.loading = false;
        m.redraw();
      };

      const handleExportProject = async () => {
        if (!state.selectedProjectId) return;

        state.loading = true;
        try {
          const project = await getProject(state.selectedProjectId);
          if (!project) {
            state.message = "Song not found";
            return;
          }
          const json = await exportProjectToJSON(project);
          downloadFile(json, `${project.metadata.title}-${Date.now()}.json`);
          state.message = "Song exported successfully!";
        } catch (error) {
          state.message = `Export failed: ${error}`;
        }
        state.loading = false;
        m.redraw();
      };

      const handleGeneratePermalink = async () => {
        if (!state.selectedProjectId) return;

        state.loading = true;
        try {
          const project = await getProject(state.selectedProjectId);
          if (!project) {
            state.message = "Song not found";
            state.loading = false;
            m.redraw();
            return;
          }

          await copyPermalinkToClipboard(project);
          state.message = "Permalink copied to clipboard!";
        } catch (error) {
          state.message = `Failed to generate permalink: ${error}`;
        }
        state.loading = false;
        m.redraw();
      };

      const handleImportPermalink = async () => {
        if (!state.importPermalink.trim()) return;

        state.loading = true;
        try {
          const project = await parsePermalink(state.importPermalink);
          await saveProject(project);
          state.message = "Song imported successfully!";
          state.importPermalink = "";
        } catch (error) {
          state.message = `Import failed: ${error}`;
        }
        state.loading = false;
        m.redraw();
      };

      const handleImportFile = async (e: Event) => {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        state.loading = true;
        try {
          const json = await readFile(file);
          const data = importAllFromJSON(json);

          for (const project of data.projects) {
            await saveProject(project);
          }
          for (const playlist of data.playlists) {
            await savePlaylist(playlist);
          }

          state.message = `Imported ${data.projects.length} project(s) and ${data.playlists.length} playlist(s)`;
        } catch (error) {
          state.message = `Import failed: ${error}`;
        }
        state.loading = false;
        m.redraw();
      };

      return m(".import-export-view.container", [
        m("h1", "Import / Export"),

        state.message &&
          m(".row", [
            m(".col.s12", [m(".card-panel.teal.lighten-4", state.message)]),
          ]),

        // Export section
        m(".row", [
          m(".col.s12", [
            m(".card", [
              m(".card-content.row", [
                m("span.card-title.col.s12", "Export"),
                m(
                  "p.col.s12",
                  "Export all your projects and playlists to a JSON file"
                ),
                m(FlatButton, {
                  label: "Export All",
                  iconName: "download",
                  onclick: handleExportAll,
                  disabled: state.loading,
                }),
              ]),
            ]),
          ]),
        ]),

        // Project-specific export
        m(".row", [
          m(".col.s12", [
            m(".card", [
              m(".card-content.row", [
                m("span.card-title.col.s12", "Export Single Song"),
                m(SearchSelect<string>, {
                  label: "Select Song",
                  className: "col s12",
                  options: state.projects.map((p) => ({
                    id: p.id,
                    label: `${p.metadata.title}${
                      p.metadata.composer ? ` - ${p.metadata.composer}` : ""
                    }`,
                  })),
                  checkedId: state.selectedProjectId
                    ? [state.selectedProjectId]
                    : [],
                  onchange: (ids: string[]) => {
                    state.selectedProjectId = ids[0] || "";
                  },
                  // placeholder: "Search for a song...",
                  searchPlaceholder: "Type to search...",
                }),

                m(FlatButton, {
                  label: "Export Song",
                  iconName: "download",
                  onclick: handleExportProject,
                  disabled: state.loading || !state.selectedProjectId,
                }),
                " ",
                m(FlatButton, {
                  label: "Generate Permalink",
                  iconName: "link",
                  onclick: handleGeneratePermalink,
                  disabled: state.loading || !state.selectedProjectId,
                }),
              ]),
            ]),
          ]),
        ]),

        // Import from permalink
        m(".row", [
          m(".col.s12", [
            m(".card", [
              m(".card-content.row", [
                m("span.card-title.col.s12", "Import from Permalink"),
                m(TextArea, {
                  label: "Permalink",
                  placeholder: "Paste permalink here",
                  value: state.importPermalink,
                  oninput: (txt) => {
                    state.importPermalink = txt;
                  },
                  rows: 3,
                }),
                m(FlatButton, {
                  label: "Import from Permalink",
                  iconName: "upload",
                  onclick: handleImportPermalink,
                  disabled: state.loading || !state.importPermalink.trim(),
                }),
              ]),
            ]),
          ]),
        ]),

        // Import from file
        m(".row", [
          m(".col.s12", [
            m(".card", [
              m(".card-content.row", [
                m("span.card-title.col.s12", "Import from File"),
                m(".file-field.input-field.col.s12", [
                  m(".btn", [
                    m("span", "File"),
                    m("input[type=file][accept=application/json]", {
                      onchange: handleImportFile,
                    }),
                  ]),
                  m(".file-path-wrapper", [
                    m("input.file-path[type=text]", {
                      placeholder: "Select JSON file",
                    }),
                  ]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ]);
    },
  };
};
