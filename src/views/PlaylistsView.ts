import m from 'mithril';
import { Playlist } from '@/models/types';
import { getAllPlaylists, deletePlaylist } from '@/services/db';

interface PlaylistsState {
  playlists: Playlist[];
  loading: boolean;
}

export const PlaylistsView: m.FactoryComponent = () => {
  let state: PlaylistsState = {
    playlists: [],
    loading: true
  };

  return {
    async oninit() {
      state.playlists = await getAllPlaylists();
      state.loading = false;
      m.redraw();
    },

    view() {
      const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this playlist?')) {
          await deletePlaylist(id);
          state.playlists = state.playlists.filter(p => p.id !== id);
          m.redraw();
        }
      };

      return m('.playlists-view.container', [
        m('h1', 'Playlists'),
        m('.row', [
          m('.col.s12', [
            m('a.btn.waves-effect.waves-light', {
              href: '#!/playlist/new',
            }, [
              m('i.material-icons.left', 'add'),
              'New Playlist'
            ])
          ])
        ]),
        state.loading
          ? m('.progress', [m('.indeterminate')])
          : state.playlists.length === 0
          ? m('.row', [
              m('.col.s12', [
                m('p', 'No playlists yet. Create one to get started!')
              ])
            ])
          : m('.row', state.playlists.map(playlist =>
              m('.col.s12.m6.l4', { key: playlist.id }, [
                m('.card', [
                  m('.card-content', [
                    m('span.card-title', playlist.name),
                    playlist.description && m('p', playlist.description),
                    m('p.grey-text', `${playlist.items.length} item(s)`)
                  ]),
                  m('.card-action', [
                    m('a', {
                      href: `#!/playlist/${playlist.id}`,
                    }, 'View'),
                    m('a', {
                      href: `#!/playlist/${playlist.id}/edit`,
                    }, 'Edit'),
                    m('a.red-text', {
                      onclick: () => handleDelete(playlist.id)
                    }, 'Delete')
                  ])
                ])
              ])
            ))
      ]);
    }
  };
};
