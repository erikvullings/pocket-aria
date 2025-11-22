import m from "mithril";
import { FlatButton, IconButton, toast } from "mithril-materialized";
import { Project } from "@/models/types";
import { getProject } from "@/services/db";
import { copyPermalinkToClipboard } from "@/utils/permalink";
import { AudioPlayer } from "@/components/AudioPlayer";
import { ScoreViewer } from "@/components/ScoreViewer";
import { LyricsViewer } from "@/components/LyricsViewer";

interface ProjectViewState {
  project: Project | null;
  loading: boolean;
  selectedScoreIndex: number;
  currentTime: number;
}

export const ProjectView: m.FactoryComponent = () => {
  let state: ProjectViewState = {
    project: null,
    loading: true,
    selectedScoreIndex: 0,
    currentTime: 0,
  };

  return {
    async oninit() {
      const projectId = m.route.param("id");
      state.project = (await getProject(projectId)) || null;
      state.loading = false;
      m.redraw();
    },

    view() {
      if (state.loading) {
        return m(".container", [m(".progress", [m(".indeterminate")])]);
      }

      if (!state.project) {
        return m(".container", [
          m("h1", "Song not found"),
          m(
            "a.btn",
            {
              href: "#!/library",
            },
            "Back to Library"
          ),
        ]);
      }

      const { project } = state;

      return m(".project-view.container", [
        m("h1", project.metadata.title),
        m(".row", [
          m(IconButton, {
            title: "Library",
            iconName: "arrow_back",
            onclick: () => m.route.set("/library"),
          }),
          " ",
          m(IconButton, {
            title: "Edit",
            iconName: "edit",
            onclick: () => m.route.set(`/song/${project.id}/edit`),
          }),
          " ",
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
                console.error("Failed to generate or copy permalink:", error);
                toast({
                  html: "Failed to generate permalink. Please try again.",
                });
              }
            },
          }),
          " ",
          m(FlatButton, {
            label: "Practice",
            iconName: "music_note",
            onclick: () => m.route.set(`/song/${project.id}/practice`),
          }),
        ]),

        // Metadata section
        m(".row", [
          m(".col.s12", [
            m(".card", [
              m(".card-content", [
                m("span.card-title", "Information"),

                // Content Type
                project.metadata.contentType &&
                  m("p", [
                    m("strong", "Type: "),
                    project.metadata.contentType === "language-learning"
                      ? "Language Learning"
                      : project.metadata.contentType.charAt(0).toUpperCase() + project.metadata.contentType.slice(1),
                  ]),

                // Classical-specific fields
                project.metadata.composer &&
                  m("p", [
                    m("strong", "Composer: "),
                    project.metadata.composer,
                  ]),
                project.metadata.operaOrWork &&
                  m("p", [
                    m("strong", "Opera / Work: "),
                    project.metadata.operaOrWork,
                  ]),
                project.metadata.characterRole &&
                  m("p", [
                    m("strong", "Character / Role: "),
                    project.metadata.characterRole,
                  ]),
                project.metadata.voiceType &&
                  m("p", [
                    m("strong", "Voice Type: "),
                    project.metadata.voiceType,
                  ]),

                // Karaoke-specific fields
                project.metadata.artist &&
                  m("p", [
                    m("strong", "Artist: "),
                    project.metadata.artist,
                  ]),

                // Language learning-specific fields
                project.metadata.language &&
                  m("p", [
                    m("strong", "Language: "),
                    project.metadata.language,
                  ]),

                // Difficulty (karaoke and language learning)
                project.metadata.difficulty &&
                  m("p", [
                    m("strong", "Difficulty: "),
                    project.metadata.difficulty.charAt(0).toUpperCase() + project.metadata.difficulty.slice(1),
                  ]),

                // Common fields
                project.metadata.genre &&
                  m("p", [m("strong", "Genre: "), project.metadata.genre]),
                project.metadata.year &&
                  m("p", [m("strong", "Year: "), project.metadata.year]),
                project.metadata.tags &&
                  project.metadata.tags.length > 0 &&
                  m("p", [
                    m("strong", "Tags: "),
                    project.metadata.tags.join(", "),
                  ]),
                project.metadata.description &&
                  m("p", project.metadata.description),
              ]),
            ]),
          ]),
        ]),

        // Audio player section
        project.audioTrack &&
          m(".row", [
            m(".col.s12", [
              m(".card", [
                m(".card-content", [
                  m("span.card-title", "Audio"),
                  m(AudioPlayer, {
                    audioTrack: project.audioTrack,
                    onTimeUpdate: (time: number) => {
                      state.currentTime = time;
                    },
                  }),
                ]),
              ]),
            ]),
          ]),

        // Score section
        project.scores &&
          project.scores.length > 0 &&
          m(".row", [
            m(".col.s12", [
              m(".card", [
                m(".card-content", [
                  m("span.card-title", "Score"),
                  project.scores.length > 1 &&
                    m(".score-selector", [
                      m("label", "Select Score:"),
                      m(
                        "select.browser-default",
                        {
                          onchange: (e: Event) => {
                            state.selectedScoreIndex = parseInt(
                              (e.target as HTMLSelectElement).value
                            );
                          },
                        },
                        project.scores.map((score, idx) =>
                          m("option", { value: idx, key: idx }, score.filename)
                        )
                      ),
                    ]),
                  m(ScoreViewer, {
                    score: project.scores[state.selectedScoreIndex],
                  }),
                ]),
              ]),
            ]),
          ]),

        // Lyrics section
        project.lyrics &&
          m(".row", [
            m(".col.s12", [
              m(".card", [
                m(".card-content", [
                  m("span.card-title", "Lyrics"),
                  m(LyricsViewer, {
                    lyrics: project.lyrics,
                    currentTime: state.currentTime,
                  }),
                ]),
              ]),
            ]),
          ]),
      ]);
    },
  };
};
