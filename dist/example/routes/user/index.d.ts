import { Context } from 'hono';
declare const _default: {
    get: (c: Context) => Response & import("hono").TypedResponse<{
        message: string;
    }, import("hono/utils/http-status").StatusCode, "json">;
    post: (c: Context) => Response & import("hono").TypedResponse<{
        message: {
            then: {};
            catch: {};
            finally: {};
        };
    }, import("hono/utils/http-status").StatusCode, "json">;
};
export default _default;
