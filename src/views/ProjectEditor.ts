import m from "mithril";
import {
  Button,
  Chips,
  NumberInput,
  Select,
  TextArea,
  TextInput,
} from "mithril-materialized";
import { Project, Genre, VoiceType, Score } from "@/models/types";
import { saveProject, getProject, generateId } from "@/services/db";

interface ProjectEditorState {
  project: Project;
  loading: boolean;
  isNew: boolean;
}

const genres: Genre[] = ["classical", "pop", "jazz", "choir", "folk", "other"];
const voiceTypes: VoiceType[] = [
  "soprano",
  "mezzo",
  "alto",
  "tenor",
  "baritone",
  "bass",
  "other",
];

export const ProjectEditor: m.FactoryComponent = () => {
  let state: ProjectEditorState = {
    project: {
      id: generateId(),
      metadata: {
        title: "",
        createdAt: Date.now(),
      },
      scores: [],
      cuePoints: [],
    },
    loading: false,
    isNew: true,
  };

  return {
    async oninit() {
      const projectId = m.route.param("id");
      const isNew = projectId === "new";

      state.project = isNew
        ? {
            id: generateId(),
            metadata: {
              title: "",
              createdAt: Date.now(),
            },
            scores: [],
            cuePoints: [],
          }
        : (await getProject(projectId)) || {
            id: generateId(),
            metadata: {
              title: "",
              createdAt: Date.now(),
            },
            scores: [],
            cuePoints: [],
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
          filename: file.name,
        };
      };

      const handleScoreUpload = async (e: Event) => {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;

        const type =
          file.type === "application/pdf"
            ? "pdf"
            : file.name.endsWith(".xml") || file.name.endsWith(".musicxml")
            ? "musicxml"
            : "image";

        const score: Score = {
          id: generateId(),
          type,
          blob: file,
          filename: file.name,
        };

        project.scores.push(score);
      };

      const handleLyricsChange = (content: string) => {
        if (!project.lyrics) {
          project.lyrics = {
            id: generateId(),
            format: "text",
            content: "",
          };
        }
        project.lyrics.content = content;
      };

      const removeScore = (index: number) => {
        project.scores.splice(index, 1);
      };

      return m(".project-editor.container", [
        m("h1", state.isNew ? "New Song" : "Edit Song"),

        m(".row", [
          m(".col.s12", [
            m(".card", [
              m(".card-content.row", [
                m("span.card-title.col.s12", "Basic Information"),

                // Title
                m(TextInput, {
                  label: "Title",
                  value: project.metadata.title,
                  oninput: (title) => (project.metadata.title = title),
                  isMandatory: true,
                }),

                // Composer
                m(TextInput, {
                  label: "Composer",
                  value: project.metadata.composer,
                  oninput: (composer) => (project.metadata.composer = composer),
                }),

                // Genre
                m(Select<Genre>, {
                  label: "Genre",
                  checkedId: project.metadata.genre,
                  options: genres.map((genre) => ({ id: genre, label: genre })),
                  onchange: (s) => (project.metadata.genre = s[0]),
                }),

                // Voice Type
                m(Select<VoiceType>, {
                  label: "Voice Type",
                  checkedId: project.metadata.voiceType,
                  options: voiceTypes.map((genre) => ({
                    id: genre,
                    label: genre,
                  })),
                  onchange: (s) => (project.metadata.voiceType = s[0]),
                }),

                // Year
                m(NumberInput, {
                  label: "Year",
                  value: project.metadata.year,
                  oninput: (year) => (project.metadata.year = year),
                }),

                // Tags
                m(Chips, {
                  label: "Tags",
                  placeholder: "Add tag",
                  data: project.metadata.tags
                    ? project.metadata.tags.map((tag) => ({ tag }))
                    : undefined,
                }),

                // Description
                m(TextArea, {
                  label: "Description",
                  helperText: "Additional notes about this song",
                  value: project.metadata.description || "",
                  oninput: (v: string) => {
                    project.metadata.description = v;
                  },
                }),
              ]),
            ]),
          ]),
        ]),

        // Audio Upload
        m(".row", [
          m(".col.s12", [
            m(".card", [
              m(".card-content.row", [
                m("span.card-title.col.s12", "Audio Track"),
                m(".file-field.input-field.col.s12", [
                  m(".btn", [
                    m("span", "Upload Audio"),
                    m("input[type=file][accept=audio/*]", {
                      onchange: handleAudioUpload,
                    }),
                  ]),
                  m(".file-path-wrapper", [
                    m("input.file-path[type=text]", {
                      placeholder: "MP3, WAV, M4A",
                      value: project.audioTrack?.filename || "",
                    }),
                  ]),
                ]),
                project.audioTrack &&
                  m("p.green-text.col.s12", `✓ ${project.audioTrack.filename}`),
              ]),
            ]),
          ]),
        ]),

        // Score Upload
        m(".row", [
          m(".col.s12", [
            m(".card", [
              m(".card-content.row", [
                m("span.card-title.col.s12", "Scores"),
                m(".file-field.input-field.col.s12", [
                  m(".btn", [
                    m("span", "Upload Score"),
                    m("input[type=file][accept=.pdf,.xml,.musicxml,image/*]", {
                      onchange: handleScoreUpload,
                    }),
                  ]),
                  m(".file-path-wrapper", [
                    m("input.file-path[type=text]", {
                      placeholder: "PDF, MusicXML, or Image",
                    }),
                  ]),
                ]),
                project.scores.length > 0 &&
                  m(
                    "ul.collection",
                    project.scores.map((score, idx) =>
                      m("li.collection-item", { key: score.id }, [
                        m("span", `${score.filename} (${score.type})`),
                        m(
                          "a.secondary-content",
                          {
                            onclick: () => removeScore(idx),
                          },
                          [m("i.material-icons.red-text", "delete")]
                        ),
                      ])
                    )
                  ),
              ]),
            ]),
          ]),
        ]),

        // Lyrics
        m(".row", [
          m(".col.s12", [
            m(".card", [
              m(".card-content.row", [
                m("span.card-title.col.s12", "Lyrics"),
                m(TextArea, {
                  className: "col s12 m6",
                  label: "Lyrics Text",
                  helperText:
                    "Enter the lyrics in plain text, Markdown, or HTML",
                  value: project.lyrics?.content || "",
                  oninput: (v: string) => {
                    handleLyricsChange(v);
                  },
                }),

                // Translation
                m(TextArea, {
                  className: "col s12 m6",
                  label: "Translation",
                  helperText: "Optional translation of the lyrics",
                  value: project.lyrics?.translation || "",
                  oninput: (v: string) => {
                    if (!project.lyrics) {
                      project.lyrics = {
                        id: generateId(),
                        format: "text",
                        content: "",
                      };
                    }
                    project.lyrics.translation = v || undefined;
                  },
                }),

                // Translation Language
                m(".input-field.col.s12", [
                  m("input#translationLanguage[type=text]", {
                    value: project.lyrics?.translationLanguage || "",
                    oninput: (e: Event) => {
                      if (!project.lyrics) {
                        project.lyrics = {
                          id: generateId(),
                          format: "text",
                          content: "",
                        };
                      }
                      const value = (e.target as HTMLInputElement).value;
                      project.lyrics.translationLanguage = value || undefined;
                    },
                  }),
                  m(
                    "label[for=translationLanguage]",
                    {
                      class: project.lyrics?.translationLanguage
                        ? "active"
                        : "",
                    },
                    "Translation Language (e.g., English, German)"
                  ),
                ]),
              ]),
            ]),
          ]),
        ]),

        // Actions
        m(".row", [
          m(".col.s12", [
            m(Button, {
              label: state.loading ? "Saving..." : "Save Song",
              iconName: "save",
              disabled: state.loading || !project.metadata.title,
              onclick: handleSave,
            }),
            " ",
            !state.isNew &&
              project.audioTrack &&
              project.lyrics &&
              m(Button, {
                label: "Timestamps",
                iconName: "schedule",
                onclick: () => m.route.set(`/song/${project.id}/lrc-editor`),
              }),
            " ",
            m(Button, {
              className: "grey",
              label: "Cancel",
              iconName: "cancel",
              disabled: state.loading || !project.metadata.title,
              onclick: () =>
                m.route.set(state.isNew ? "/library" : `/song/${project.id}`),
            }),
          ]),
        ]),
      ]);
    },
  };
};
