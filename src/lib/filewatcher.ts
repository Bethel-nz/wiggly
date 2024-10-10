import chokidar from 'chokidar';
import debounce from 'lodash.debounce';

export class FileWatcher {
  private paths: string[];
  private onChange: () => void;
  private watcher: chokidar.FSWatcher | null;

  constructor(paths: string[], onChange: () => void) {
    this.paths = paths;
    this.onChange = debounce(onChange, 300); // Debounce by 300ms
    this.watcher = null;
  }

  start(): void {
    if (this.watcher) return;

    this.watcher = chokidar.watch(this.paths, {
      ignoreInitial: true,
      persistent: true,
      usePolling: false,
      interval: 100,
      binaryInterval: 300,
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      depth: 99,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100,
      },
    });

    this.watcher.on('all', (event, path) => {
      if (['add', 'change', 'unlink'].includes(event)) {
        this.onChange();
      }
    });

    console.log('File watcher started with optimized settings.');
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
