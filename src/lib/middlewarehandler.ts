import fs from 'fs';
import path from 'path';
import { Hono } from 'hono';
import { logger } from 'hono/logger';

export class MiddlewareHandler {
  private app: Hono;
  private useLogger: boolean;
  private middlewareDir: string;
  private basePath: string;

  constructor(
    app: Hono,
    useLogger: boolean,
    middlewareDir: string,
    basePath: string
  ) {
    this.app = app;
    this.useLogger = useLogger;
    this.middlewareDir = middlewareDir;
    this.basePath = basePath;
  }

  applyMiddleware(directory: string, basePath: string = '/'): void {
    const middlewareFiles = [
      path.join(directory, '_middleware.ts'),
      path.join(directory, '_index.ts'),
    ];

    middlewareFiles.forEach((filePath) => {
      if (
        fs.existsSync(filePath) &&
        this.isValidFile(filePath) &&
        fs.statSync(filePath).size > 0
      ) {
        const middleware = require(filePath).default._;
        if (typeof middleware === 'function') {
          this.app.use(`${basePath}/*`, middleware);
        }
      }
    });
  }

  applyGlobalMiddleware(): void {
    if (fs.existsSync(this.middlewareDir)) {
      fs.readdirSync(this.middlewareDir).forEach((file) => {
        const filePath = path.join(this.middlewareDir, file);
        if (
          this.isValidFile(filePath) &&
          this.isMiddlewareFile(file, this.middlewareDir) &&
          fs.statSync(filePath).size > 0
        ) {
          const middleware = require(filePath).default._;
          if (typeof middleware === 'function') {
            this.app.use('*', middleware);
          }
        }
      });
    }

    if (this.useLogger) this.app.use('*', logger());
  }

  reset(): void {
    // Reinitialize the Hono app with the base path
    this.app = this.app || new Hono().basePath(this.basePath);
    this.applyGlobalMiddleware();
  }

  private isValidFile(filePath: string): boolean {
    return ['.js', '.ts'].includes(path.extname(filePath));
  }

  private isMiddlewareFile(fileName: string, directory: string): boolean {
    return (
      (fileName.includes('_middleware') ||
        fileName.includes('_index') ||
        fileName.startsWith('_')) &&
      directory === this.middlewareDir
    );
  }
}
