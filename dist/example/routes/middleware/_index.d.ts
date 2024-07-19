import { Context, Next } from 'hono';
/**
 * Middleware that logs request and response details.
 * Logs the HTTP method, request URL, and response status.
 */
declare const _default: {
    _: (c: Context, next: Next) => Promise<void>;
};
export default _default;
