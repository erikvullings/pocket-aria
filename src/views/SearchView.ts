import m from "mithril";
import { Project } from "@/models/types";
import { getAllProjects } from "@/services/db";
import { initSearchIndex, searchProjects } from "@/services/search";
import { TextInput } from "mithril-materialized";

interface SearchState {
  query: string;
  results: Project[];
  loading: boolean;
  initialized: boolean;
}

export const SearchView: m.FactoryComponent = () => {
  let state: SearchState = {
    query: "",
    results: [],
    loading: true,
    initialized: false,
  };

  return {
    async oninit() {
      // Initialize search index
      const projects = await getAllProjects();
      initSearchIndex(projects);
      state.initialized = true;
      state.loading = false;
      m.redraw();
    },

    view() {
      const handleSearch = (e: Event) => {
        e.preventDefault();
        if (state.query.trim()) {
          state.results = searchProjects(state.query);
        } else {
          state.results = [];
        }
      };

      return m(".search-view.container", [
        m("h1", "Search"),
        m(".row", [
          m(".col.s12", [
            m("form", { onsubmit: handleSearch }, [
              m(TextInput, {
                label: "Search",
                iconName: "search",
                placeholder: "Search by title, composer, tags...",
                oninput: (v) => {
                  state.query = v;
                },
              }),
            ]),
          ]),
        ]),

        state.loading
          ? m(".progress", [m(".indeterminate")])
          : state.results.length > 0
          ? m(".row", [
              m("h5", `Found ${state.results.length} result(s)`),
              state.results.map((project) =>
                m(".col.s12.m6.l4", { key: project.id }, [
                  m(".card", [
                    m(".card-content", [
                      m("span.card-title", project.metadata.title),
                      project.metadata.composer &&
                        m("p", `Composer: ${project.metadata.composer}`),
                      project.metadata.voiceType &&
                        m("p", `Voice: ${project.metadata.voiceType}`),
                      project.metadata.genre &&
                        m("p.grey-text", project.metadata.genre),
                    ]),
                    m(".card-action", [
                      m(
                        "a",
                        {
                          href: `#!/song/${project.id}`,
                        },
                        "View"
                      ),
                    ]),
                  ]),
                ])
              ),
            ])
          : state.query &&
            m(".row", [m(".col.s12", [m("p", "No results found")])]),
      ]);
    },
  };
};
