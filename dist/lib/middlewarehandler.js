import fs from 'fs';
import path from 'path';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
export class MiddlewareHandler {
    app;
    useLogger;
    middlewareDir;
    basePath;
    constructor(app, useLogger, middlewareDir, basePath) {
        this.app = app;
        this.useLogger = useLogger;
        this.middlewareDir = middlewareDir;
        this.basePath = basePath;
    }
    applyMiddleware(directory, basePath = '/') {
        const middlewareFiles = [
            path.join(directory, '_middleware.ts'),
            path.join(directory, '_index.ts'),
        ];
        middlewareFiles.forEach((filePath) => {
            if (fs.existsSync(filePath) &&
                this.isValidFile(filePath) &&
                fs.statSync(filePath).size > 0) {
                const middleware = require(filePath).default._;
                if (typeof middleware === 'function') {
                    this.app.use(`${basePath}/*`, middleware);
                }
            }
        });
    }
    applyGlobalMiddleware() {
        if (fs.existsSync(this.middlewareDir)) {
            fs.readdirSync(this.middlewareDir).forEach((file) => {
                const filePath = path.join(this.middlewareDir, file);
                if (this.isValidFile(filePath) &&
                    this.isMiddlewareFile(file, this.middlewareDir) &&
                    fs.statSync(filePath).size > 0) {
                    const middleware = require(filePath).default._;
                    if (typeof middleware === 'function') {
                        this.app.use('*', middleware);
                    }
                }
            });
        }
        if (this.useLogger)
            this.app.use('*', logger());
    }
    reset() {
        // Reinitialize the Hono app with the base path
        this.app = this.app || new Hono().basePath(this.basePath);
        this.applyGlobalMiddleware();
    }
    isValidFile(filePath) {
        return ['.js', '.ts'].includes(path.extname(filePath));
    }
    isMiddlewareFile(fileName, directory) {
        return ((fileName.includes('_middleware') ||
            fileName.includes('_index') ||
            fileName.startsWith('_')) &&
            directory === this.middlewareDir);
    }
}
