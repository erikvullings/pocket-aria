import m from 'mithril';
import { getAllProjects, getAllPlaylists, saveProject, savePlaylist } from '@/services/db';
import {
  exportAllToJSON,
  exportProjectToJSON,
  importAllFromJSON,
  generatePermalink,
  parsePermalink,
  downloadFile,
  readFile
} from '@/services/import-export';
import { getProject } from '@/services/db';

interface ImportExportState {
  loading: boolean;
  permalink: string;
  importPermalink: string;
  message: string;
  selectedProjectId: string;
}

export const ImportExportView: m.FactoryComponent = () => {
  let state: ImportExportState = {
    loading: false,
    permalink: '',
    importPermalink: '',
    message: '',
    selectedProjectId: ''
  };

  return {
    view() {

    const handleExportAll = async () => {
      state.loading = true;
      try {
        const projects = await getAllProjects();
        const playlists = await getAllPlaylists();
        const json = await exportAllToJSON(projects, playlists);
        downloadFile(json, `pocketaria-export-${Date.now()}.json`);
        state.message = 'Export successful!';
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
          state.message = 'Song not found';
          return;
        }
        const json = await exportProjectToJSON(project);
        downloadFile(json, `${project.metadata.title}-${Date.now()}.json`);
        state.message = 'Song exported successfully!';
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
          state.message = 'Song not found';
          return;
        }
        state.permalink = await generatePermalink(project);
        state.message = 'Permalink generated!';
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
        const project = parsePermalink(state.importPermalink);
        await saveProject(project);
        state.message = 'Song imported successfully!';
        state.importPermalink = '';
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

    return m('.import-export-view.container', [
      m('h1', 'Import / Export'),

      state.message && m('.row', [
        m('.col.s12', [
          m('.card-panel.teal.lighten-4', state.message)
        ])
      ]),

      // Export section
      m('.row', [
        m('.col.s12', [
          m('.card', [
            m('.card-content', [
              m('span.card-title', 'Export'),
              m('p', 'Export all your projects and playlists to a JSON file'),
              m('button.btn.waves-effect.waves-light', {
                onclick: handleExportAll,
                disabled: state.loading
              }, [
                m('i.material-icons.left', 'download'),
                'Export All'
              ])
            ])
          ])
        ])
      ]),

      // Project-specific export
      m('.row', [
        m('.col.s12', [
          m('.card', [
            m('.card-content', [
              m('span.card-title', 'Export Single Song'),
              m('.input-field', [
                m('input#project-id[type=text]', {
                  value: state.selectedProjectId,
                  oninput: (e: Event) => {
                    state.selectedProjectId = (e.target as HTMLInputElement).value;
                  },
                  placeholder: 'Enter song ID'
                }),
                m('label[for=project-id]', 'Song ID')
              ]),
              m('button.btn.waves-effect.waves-light', {
                onclick: handleExportProject,
                disabled: state.loading || !state.selectedProjectId
              }, [
                m('i.material-icons.left', 'download'),
                'Export Song'
              ]),
              ' ',
              m('button.btn.waves-effect.waves-light', {
                onclick: handleGeneratePermalink,
                disabled: state.loading || !state.selectedProjectId
              }, [
                m('i.material-icons.left', 'link'),
                'Generate Permalink'
              ]),
              state.permalink && m('.permalink-result', [
                m('p', 'Permalink (copy and share):'),
                m('textarea.materialize-textarea', {
                  value: state.permalink,
                  rows: 3,
                  readonly: true,
                  onclick: (e: Event) => {
                    (e.target as HTMLTextAreaElement).select();
                    document.execCommand('copy');
                  }
                })
              ])
            ])
          ])
        ])
      ]),

      // Import from permalink
      m('.row', [
        m('.col.s12', [
          m('.card', [
            m('.card-content', [
              m('span.card-title', 'Import from Permalink'),
              m('.input-field', [
                m('textarea#import-permalink.materialize-textarea', {
                  value: state.importPermalink,
                  oninput: (e: Event) => {
                    state.importPermalink = (e.target as HTMLTextAreaElement).value;
                  },
                  placeholder: 'Paste permalink here',
                  rows: 3
                }),
                m('label[for=import-permalink]', 'Permalink')
              ]),
              m('button.btn.waves-effect.waves-light', {
                onclick: handleImportPermalink,
                disabled: state.loading || !state.importPermalink.trim()
              }, [
                m('i.material-icons.left', 'upload'),
                'Import from Permalink'
              ])
            ])
          ])
        ])
      ]),

      // Import from file
      m('.row', [
        m('.col.s12', [
          m('.card', [
            m('.card-content', [
              m('span.card-title', 'Import from File'),
              m('.file-field.input-field', [
                m('.btn', [
                  m('span', 'File'),
                  m('input[type=file][accept=application/json]', {
                    onchange: handleImportFile
                  })
                ]),
                m('.file-path-wrapper', [
                  m('input.file-path[type=text]', {
                    placeholder: 'Select JSON file'
                  })
                ])
              ])
            ])
          ])
        ])
      ])
    ]);
    }
  };
};
