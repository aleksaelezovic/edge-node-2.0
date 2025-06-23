import { resolver, validator } from "hono-openapi/zod";
import { z } from "zod";
import { extendZodWithOpenApi } from "zod-openapi";

extendZodWithOpenApi(z);

export { z, resolver, validator };
export * from "hono-openapi";
