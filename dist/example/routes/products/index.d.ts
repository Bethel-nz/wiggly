import { Context } from 'hono';
declare const _default: {
    get: (c: Context) => Promise<Response & import("hono").TypedResponse<{
        message: string;
    }, import("hono/utils/http-status").StatusCode, "json">>;
    post: (c: Context) => Promise<Response & import("hono").TypedResponse<{
        message: any;
    }, import("hono/utils/http-status").StatusCode, "json">>;
};
export default _default;
