import { defineDkgPlugin } from "@dkg/plugins";
import {
  z,
  describeRoute,
  resolver,
  validator,
  createMiddleware,
  jwt,
  sign,
} from "@dkg/plugins/hono";

type Scope = string[];

export default <Credentials>({
  secret,
  schema,
  login,
  logout,
  expiresInSeconds: exp = 3600,
  requireAuthByDefault,
}: {
  secret: string;
  schema: z.Schema<Credentials>;
  login: (credentials: Credentials) => Promise<Scope>;
  logout?: () => Promise<void>;
  expiresInSeconds?: number;
  requireAuthByDefault?: boolean;
}) =>
  defineDkgPlugin((ctx, mcp, api) => {
    api.post(
      "/login",
      describeRoute({
        description: "Authenticate user and return JWT token",
        responses: {
          200: {
            description: "JWT token",
            content: {
              "application/json": {
                schema: resolver(z.object({ token: z.string() })),
              },
            },
          },
          401: {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: resolver(
                  z.object({ error: z.literal("Invalid credentials.") }),
                ),
              },
            },
          },
        },
      }),
      validator("json", schema),
      async (c) => {
        try {
          const credentials = c.req.valid("json");
          const scope = await login(credentials);
          const token = await sign(
            { scope, exp: Math.floor(Date.now() / 1000) + exp },
            secret,
            "HS256",
          );

          return c.json({ token });
        } catch {
          return c.json({ error: "Invalid credentials." }, 401);
        }
      },
    );

    if (requireAuthByDefault) {
      api.use("*", jwt({ secret }));
      api.use("/mcp", authorized(["mcp"]));
    } else {
      api.use("*", async (c, next) => jwt({ secret })(c, next).catch(next));
    }

    api.post("/logout", async (c) => {
      if (logout) await logout();
      return c.status(200);
    });
  });

export const authorized = (scope: Scope) =>
  createMiddleware(async (c, next) => {
    if (scope.length === 0) return next();
    if (scope.length === 1 && scope[0] === "*") return next();

    const payload = c.get("jwtPayload");
    const userScope: Scope = payload.scope?.split(" ") ?? [];
    if (scope.every((s) => s in userScope)) return next();

    return c.json({ error: "Unauthorized." }, 403);
  });
