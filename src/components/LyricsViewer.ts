import m from 'mithril';
import { render } from 'slimdown-js';
import { Lyrics } from '@/models/types';

export interface LyricsViewerAttrs {
  lyrics: Lyrics;
  currentTime?: number;
}

export const LyricsViewer: m.FactoryComponent<LyricsViewerAttrs> = () => {
  return {
    view(vnode) {
      const { lyrics } = vnode.attrs;

      const renderContent = (content: string, format: string) => {
        switch (format) {
          case 'html':
            return m.trust(content);
          case 'markdown':
            return m.trust(render(content));
          case 'text':
          default:
            return content.split('\n').map(line =>
              m('p', line || m('br'))
            );
        }
      };

      return m('.lyrics-viewer', [
        lyrics.translation ? m('.row', {
          style: 'margin: 0;'
        }, [
          m('.col.s12.m6', [
            m('h4', {
              style: 'color: #666; font-size: 0.9em; margin-bottom: 10px;'
            }, 'Original'),
            m('.lyrics-content', renderContent(lyrics.content, lyrics.format))
          ]),
          m('.col.s12.m6', [
            m('h4', {
              style: 'color: #666; font-size: 0.9em; margin-bottom: 10px;'
            }, lyrics.translationLanguage ? `Translation (${lyrics.translationLanguage})` : 'Translation'),
            m('.lyrics-content', {
              style: 'font-style: italic; color: #555;'
            }, renderContent(lyrics.translation, lyrics.format))
          ])
        ]) : m('.lyrics-content', renderContent(lyrics.content, lyrics.format))
      ]);
    }
  };
};
