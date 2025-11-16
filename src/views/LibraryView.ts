import m from 'mithril';
import { Project } from '@/models/types';
import { getAllProjects, deleteProject } from '@/services/db';

interface LibraryState {
  projects: Project[];
  loading: boolean;
}

export const LibraryView: m.FactoryComponent = () => {
  let state: LibraryState = {
    projects: [],
    loading: true
  };

  return {
    async oninit() {
      state.projects = await getAllProjects();
      state.loading = false;
      m.redraw();
    },

    view() {
      const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this project?')) {
          await deleteProject(id);
          state.projects = state.projects.filter(p => p.id !== id);
          m.redraw();
        }
      };

      return m('.library-view.container', [
        m('h1', 'Library'),
        m('.row', [
          m('.col.s12', [
            m('a.btn.waves-effect.waves-light', {
              href: '#!/song/new',
            }, [
              m('i.material-icons.left', 'add'),
              'New Song'
            ])
          ])
        ]),
        state.loading
          ? m('.progress', [m('.indeterminate')])
          : m('.row', state.projects.map(project =>
              m('.col.s12.m6.l4', { key: project.id }, [
                m('.card', [
                  m('.card-content', [
                    m('span.card-title', project.metadata.title),
                    project.metadata.composer && m('p', `Composer: ${project.metadata.composer}`),
                    project.metadata.voiceType && m('p', `Voice: ${project.metadata.voiceType}`),
                    project.metadata.genre && m('p.grey-text', project.metadata.genre)
                  ]),
                  m('.card-action', [
                    m('a', {
                      href: `#!/song/${project.id}`,
                    }, 'View'),
                    m('a', {
                      href: `#!/song/${project.id}/edit`,
                    }, 'Edit'),
                    m('a.red-text', {
                      onclick: () => handleDelete(project.id)
                    }, 'Delete')
                  ])
                ])
              ])
            ))
      ]);
    }
  };
};
