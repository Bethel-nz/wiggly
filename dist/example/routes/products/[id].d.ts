import { Context } from 'hono';
declare const _default: {
    get: (c: Context) => Promise<(Response & import("hono").TypedResponse<{
        id: string;
        name: string;
        description: string;
        price: number;
    }, import("hono/utils/http-status").StatusCode, "json">) | (Response & import("hono").TypedResponse<"Product not found", 404, "text">)>;
    put: (c: Context) => Promise<Response & import("hono").TypedResponse<{
        id: string;
        name: string;
        description: string;
        price: number;
    } | null, import("hono/utils/http-status").StatusCode, "json">>;
    delete: (c: Context) => Promise<Response & import("hono").TypedResponse<"Product deleted", 200, "text">>;
};
export default _default;
