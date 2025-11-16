import m from 'mithril';
import { Project, Genre, VoiceType, Score } from '@/models/types';
import { saveProject, getProject, generateId } from '@/services/db';

interface ProjectEditorState {
  project: Project;
  loading: boolean;
  isNew: boolean;
}

const genres: Genre[] = ['classical', 'pop', 'jazz', 'choir', 'folk', 'other'];
const voiceTypes: VoiceType[] = ['soprano', 'mezzo', 'alto', 'tenor', 'baritone', 'bass', 'other'];

export const ProjectEditor: m.FactoryComponent = () => {
  let state: ProjectEditorState = {
    project: {
      id: generateId(),
      metadata: {
        title: '',
        createdAt: Date.now()
      },
      scores: [],
      cuePoints: []
    },
    loading: false,
    isNew: true
  };

  return {
    async oninit() {
      const projectId = m.route.param('id');
      const isNew = projectId === 'new';

      state.project = isNew ? {
        id: generateId(),
        metadata: {
          title: '',
          createdAt: Date.now()
        },
        scores: [],
        cuePoints: []
      } : (await getProject(projectId)) || {
        id: generateId(),
        metadata: {
          title: '',
          createdAt: Date.now()
        },
        scores: [],
        cuePoints: []
      };
      state.loading = false;
      state.isNew = isNew;
      m.redraw();
    },

    view() {
      const { project } = state;

    const handleSave = async () => {
      state.loading = true;
      try {
        await saveProject(project);
        m.route.set(`/project/${project.id}`);
      } catch (error) {
        alert(`Failed to save song: ${error}`);
        state.loading = false;
      }
    };

    const handleAudioUpload = async (e: Event) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;

      project.audioTrack = {
        id: generateId(),
        blob: file,
        filename: file.name
      };
    };

    const handleScoreUpload = async (e: Event) => {
      const input = e.target as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) return;

      const type = file.type === 'application/pdf' ? 'pdf' :
                   file.name.endsWith('.xml') || file.name.endsWith('.musicxml') ? 'musicxml' :
                   'image';

      const score: Score = {
        id: generateId(),
        type,
        blob: file,
        filename: file.name
      };

      project.scores.push(score);
    };

    const handleLyricsChange = (content: string) => {
      if (!project.lyrics) {
        project.lyrics = {
          id: generateId(),
          format: 'text',
          content: ''
        };
      }
      project.lyrics.content = content;
    };

    const handleTagInput = (e: KeyboardEvent) => {
      const input = e.target as HTMLInputElement;
      if (e.key === 'Enter' && input.value.trim()) {
        e.preventDefault();
        if (!project.metadata.tags) {
          project.metadata.tags = [];
        }
        project.metadata.tags.push(input.value.trim());
        input.value = '';
      }
    };

    const removeTag = (index: number) => {
      project.metadata.tags?.splice(index, 1);
    };

    const removeScore = (index: number) => {
      project.scores.splice(index, 1);
    };

    return m('.project-editor.container', [
      m('h1', state.isNew ? 'New Song' : 'Edit Song'),

      m('.row', [
        m('.col.s12', [
          m('.card', [
            m('.card-content', [
              m('span.card-title', 'Basic Information'),

              // Title
              m('.input-field', [
                m('input#title[type=text]', {
                  value: project.metadata.title,
                  oninput: (e: Event) => {
                    project.metadata.title = (e.target as HTMLInputElement).value;
                  },
                  required: true
                }),
                m('label[for=title]', { class: project.metadata.title ? 'active' : '' }, 'Title *')
              ]),

              // Composer
              m('.input-field', [
                m('input#composer[type=text]', {
                  value: project.metadata.composer || '',
                  oninput: (e: Event) => {
                    project.metadata.composer = (e.target as HTMLInputElement).value;
                  }
                }),
                m('label[for=composer]', { class: project.metadata.composer ? 'active' : '' }, 'Composer')
              ]),

              // Genre
              m('.input-field', [
                m('select.browser-default', {
                  value: project.metadata.genre || '',
                  onchange: (e: Event) => {
                    const value = (e.target as HTMLSelectElement).value;
                    project.metadata.genre = value ? value as Genre : undefined;
                  }
                }, [
                  m('option', { value: '' }, 'Select Genre'),
                  ...genres.map(genre =>
                    m('option', { value: genre }, genre)
                  )
                ])
              ]),

              // Voice Type
              m('.input-field', [
                m('select.browser-default', {
                  value: project.metadata.voiceType || '',
                  onchange: (e: Event) => {
                    const value = (e.target as HTMLSelectElement).value;
                    project.metadata.voiceType = value ? value as VoiceType : undefined;
                  }
                }, [
                  m('option', { value: '' }, 'Select Voice Type'),
                  ...voiceTypes.map(type =>
                    m('option', { value: type }, type)
                  )
                ])
              ]),

              // Year
              m('.input-field', [
                m('input#year[type=number]', {
                  value: project.metadata.year || '',
                  oninput: (e: Event) => {
                    const value = (e.target as HTMLInputElement).value;
                    project.metadata.year = value ? parseInt(value) : undefined;
                  }
                }),
                m('label[for=year]', { class: project.metadata.year ? 'active' : '' }, 'Year')
              ]),

              // Tags
              m('.input-field', [
                m('input#tags[type=text]', {
                  onkeydown: handleTagInput,
                  placeholder: 'Press Enter to add tag'
                }),
                m('label[for=tags]', 'Tags')
              ]),
              project.metadata.tags && project.metadata.tags.length > 0 && m('.chips',
                project.metadata.tags.map((tag, idx) =>
                  m('.chip', { key: idx }, [
                    tag,
                    m('i.material-icons.close', {
                      onclick: () => removeTag(idx)
                    }, 'close')
                  ])
                )
              ),

              // Description
              m('.input-field', [
                m('textarea#description.materialize-textarea', {
                  value: project.metadata.description || '',
                  oninput: (e: Event) => {
                    project.metadata.description = (e.target as HTMLTextAreaElement).value;
                  }
                }),
                m('label[for=description]', { class: project.metadata.description ? 'active' : '' }, 'Description')
              ])
            ])
          ])
        ])
      ]),

      // Audio Upload
      m('.row', [
        m('.col.s12', [
          m('.card', [
            m('.card-content', [
              m('span.card-title', 'Audio Track'),
              m('.file-field.input-field', [
                m('.btn', [
                  m('span', 'Upload Audio'),
                  m('input[type=file][accept=audio/*]', {
                    onchange: handleAudioUpload
                  })
                ]),
                m('.file-path-wrapper', [
                  m('input.file-path[type=text]', {
                    placeholder: 'MP3, WAV, M4A',
                    value: project.audioTrack?.filename || ''
                  })
                ])
              ]),
              project.audioTrack && m('p.green-text', `✓ ${project.audioTrack.filename}`)
            ])
          ])
        ])
      ]),

      // Score Upload
      m('.row', [
        m('.col.s12', [
          m('.card', [
            m('.card-content', [
              m('span.card-title', 'Scores'),
              m('.file-field.input-field', [
                m('.btn', [
                  m('span', 'Upload Score'),
                  m('input[type=file][accept=.pdf,.xml,.musicxml,image/*]', {
                    onchange: handleScoreUpload
                  })
                ]),
                m('.file-path-wrapper', [
                  m('input.file-path[type=text]', {
                    placeholder: 'PDF, MusicXML, or Image'
                  })
                ])
              ]),
              project.scores.length > 0 && m('ul.collection',
                project.scores.map((score, idx) =>
                  m('li.collection-item', { key: score.id }, [
                    m('span', `${score.filename} (${score.type})`),
                    m('a.secondary-content', {
                      onclick: () => removeScore(idx)
                    }, [
                      m('i.material-icons.red-text', 'delete')
                    ])
                  ])
                )
              )
            ])
          ])
        ])
      ]),

      // Lyrics
      m('.row', [
        m('.col.s12', [
          m('.card', [
            m('.card-content', [
              m('span.card-title', 'Lyrics'),
              m('.input-field', [
                m('textarea#lyrics.materialize-textarea', {
                  value: project.lyrics?.content || '',
                  oninput: (e: Event) => {
                    handleLyricsChange((e.target as HTMLTextAreaElement).value);
                  },
                  rows: 10
                }),
                m('label[for=lyrics]', { class: project.lyrics?.content ? 'active' : '' }, 'Lyrics Text')
              ])
            ])
          ])
        ])
      ]),

      // Actions
      m('.row', [
        m('.col.s12', [
          m('button.btn.waves-effect.waves-light', {
            onclick: handleSave,
            disabled: state.loading || !project.metadata.title
          }, [
            m('i.material-icons.left', 'save'),
            state.loading ? 'Saving...' : 'Save Song'
          ]),
          ' ',
          m('a.btn.grey.waves-effect.waves-light', {
            href: state.isNew ? '#!/library' : `#!/song/${project.id}`,
          }, 'Cancel')
        ])
      ])
    ]);
    }
  };
};
