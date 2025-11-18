import m from "mithril";
import { initDB } from "./services/db";
import mainImage from "./assets/main.webp";

interface NavItem {
  href: string;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { href: "#!/library", icon: "library_music", label: "Library" },
  { href: "#!/search", icon: "search", label: "Search" },
  { href: "#!/playlists", icon: "playlist_play", label: "Playlists" },
  { href: "#!/import-export", icon: "import_export", label: "Import/Export" },
];

export const App: m.FactoryComponent = () => {
  return {
    async oninit() {
      // Initialize database
      await initDB();
    },

    view(vnode) {
      return m(".app", [
        // Navigation
        m("nav.blue.darken-2", [
          m(".nav-wrapper.container", [
            m("a.brand-logo", { href: "#!/library" }, "PocketAria"),
            m(
              "ul.right.hide-on-med-and-down",
              navItems.map((item) =>
                m("li", { key: item.href }, [
                  m("a", { href: item.href }, [
                    m("i.material-icons.left", item.icon),
                    item.label,
                  ]),
                ])
              )
            ),
          ]),
        ]),

        // Main content - render children here
        m("main", [m(".route-container", vnode.children)]),

        // Footer
        m("footer.page-footer.blue.darken-2", [
          m(".container", [
            m(".row", [
              m(".col.s12.m6", [
                m("img.logo-small", {
                  src: mainImage,
                  alt: "PocketAria",
                }),
              ]),
              m(".col.s12.m6", [
                m("h5.white-text", "PocketAria"),
                m(
                  "p.grey-text.text-lighten-4",
                  "Your offline vocal repertoire manager"
                ),
              ]),
            ]),
          ]),
        ]),
      ]);
    },
  };
};
