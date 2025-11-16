import m from 'mithril';
import { Score } from '@/models/types';
import * as pdfjsLib from 'pdfjs-dist';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ScoreViewerAttrs {
  score: Score;
}

interface ScoreViewerState {
  currentPage: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  renderPage?: (pageNum: number) => Promise<void>;
}

async function renderPDF(state: ScoreViewerState, blob: Blob, container: HTMLElement) {
  const url = URL.createObjectURL(blob);
  const pdf = await pdfjsLib.getDocument(url).promise;
  state.totalPages = pdf.numPages;

  const renderPage = async (pageNum: number) => {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas
    }).promise;

    container.innerHTML = '';
    container.appendChild(canvas);
  };

  await renderPage(state.currentPage);

  // Store render function for page navigation
  state.renderPage = renderPage;
}

async function renderImage(blob: Blob, container: HTMLElement) {
  const url = URL.createObjectURL(blob);
  const img = document.createElement('img');
  img.src = url;
  img.style.maxWidth = '100%';
  img.style.height = 'auto';
  container.innerHTML = '';
  container.appendChild(img);
}

async function renderMusicXML(_blob: Blob, container: HTMLElement) {
  // Note: OSMD (OpenSheetMusicDisplay) implementation
  // This is a simplified version - full implementation would require OSMD setup

  // Placeholder for OSMD integration
  // const osmd = new OpenSheetMusicDisplay(container);
  // await osmd.load(text);
  // osmd.render();

  container.innerHTML = '<p>MusicXML viewer requires OpenSheetMusicDisplay library setup</p>';
}

export const ScoreViewer: m.FactoryComponent<ScoreViewerAttrs> = () => {
  let state: ScoreViewerState = {
    currentPage: 1,
    totalPages: 1,
    loading: true,
    error: null
  };

  return {
    async oncreate(vnode) {
      const { score } = vnode.attrs;

      try {
        const container = document.getElementById('score-container');
        if (!container) return;

        if (score.type === 'pdf') {
          await renderPDF(state, score.blob, container);
        } else if (score.type === 'image') {
          await renderImage(score.blob, container);
        } else if (score.type === 'musicxml') {
          await renderMusicXML(score.blob, container);
        }

        state.loading = false;
        m.redraw();
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Failed to load score';
        state.loading = false;
        m.redraw();
      }
    },

    view(vnode) {
      const { score } = vnode.attrs;

      const nextPage = () => {
        if (state.currentPage < state.totalPages && state.renderPage) {
          state.currentPage++;
          state.renderPage(state.currentPage);
        }
      };

      const prevPage = () => {
        if (state.currentPage > 1 && state.renderPage) {
          state.currentPage--;
          state.renderPage(state.currentPage);
        }
      };

      return m('.score-viewer', [
        state.loading && m('.progress', [
          m('.indeterminate')
        ]),
        state.error && m('.error.red-text', state.error),
        m('#score-container'),
        score.type === 'pdf' && state.totalPages > 1 && m('.pagination-controls', [
          m('button.btn.waves-effect', {
            onclick: prevPage,
            disabled: state.currentPage === 1
          }, [
            m('i.material-icons', 'chevron_left')
          ]),
          m('span.page-info', `Page ${state.currentPage} of ${state.totalPages}`),
          m('button.btn.waves-effect', {
            onclick: nextPage,
            disabled: state.currentPage === state.totalPages
          }, [
            m('i.material-icons', 'chevron_right')
          ])
        ])
      ]);
    }
  };
};
