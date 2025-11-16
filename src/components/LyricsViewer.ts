import m from 'mithril';
import { Lyrics } from '@/models/types';

export interface LyricsViewerAttrs {
  lyrics: Lyrics;
  currentTime?: number;
}

export const LyricsViewer: m.FactoryComponent<LyricsViewerAttrs> = () => {
  return {
    view(vnode) {
      const { lyrics } = vnode.attrs;

      const renderContent = () => {
        switch (lyrics.format) {
          case 'html':
            return m.trust(lyrics.content);
          case 'markdown':
            // Simple markdown rendering (for production, use a proper markdown library)
            return m.trust(lyrics.content
              .replace(/^### (.*$)/gim, '<h3>$1</h3>')
              .replace(/^## (.*$)/gim, '<h2>$1</h2>')
              .replace(/^# (.*$)/gim, '<h1>$1</h1>')
              .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
              .replace(/\*(.*)\*/gim, '<em>$1</em>')
              .replace(/\n/gim, '<br>')
            );
          case 'text':
          default:
            return lyrics.content.split('\n').map(line =>
              m('p', line || m('br'))
            );
        }
      };

      return m('.lyrics-viewer', [
        m('.lyrics-content', renderContent())
      ]);
    }
  };
};
