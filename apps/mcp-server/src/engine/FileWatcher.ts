import chokidar, { FSWatcher } from 'chokidar';
import * as path from 'path';

export class FileWatcher {
    private watcher: FSWatcher;

    constructor(private skillsDir: string, private onUpdate: () => void) {
        this.watcher = chokidar.watch(this.skillsDir, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true,
            ignoreInitial: true,
        });
    }

    start(): void {
        this.watcher
            .on('add', (filePath: string) => this.handleUpdate(filePath))
            .on('change', (filePath: string) => this.handleUpdate(filePath))
            .on('unlink', (filePath: string) => this.handleUpdate(filePath));

        console.error(`Watching for skill changes in ${this.skillsDir}`);
    }

    private handleUpdate(filePath: string): void {
        // Only care about manifest.json or prompt.md changes
        if (filePath.endsWith('manifest.json') || filePath.endsWith('prompt.md')) {
            console.error(`Skill changed: ${path.basename(path.dirname(filePath))}`);
            this.onUpdate();
        }
    }

    async stop(): Promise<void> {
        await this.watcher.close();
    }
}
