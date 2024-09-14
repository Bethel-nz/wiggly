export declare class FileWatcher {
    private paths;
    private onChange;
    private watcher;
    constructor(paths: string[], onChange: () => void);
    start(): void;
    stop(): void;
}
