import { defineDkgPlugin } from "@dkg/plugins";
import { openAPIRoute, z } from "@dkg/plugin-swagger";

export type PasswordResetProvider = {
  generateCode: (email: string) => Promise<string | null>;
  verifyCode: (code: string) => Promise<{ userId: string } | null>;
  setPassword: (userId: string, newPassword: string) => Promise<void>;
  verifyPassword: (userId: string, currentPassword: string) => Promise<boolean>;
};

export type PasswordResetPluginConfig = {
  sendMail: (toAddress: string, code: string) => Promise<void>;
  provider: PasswordResetProvider;
};

export default ({ sendMail, provider }: PasswordResetPluginConfig) =>
  defineDkgPlugin((_, mcp, api) => {
    async function sendResetLink(email: string) {
      const code = await provider.generateCode(email).catch(() => null);
      if (!code) return;
      await sendMail(email, code);
    }

    async function resetPassword(code: string, newPassword: string) {
      const result = await provider.verifyCode(code);
      if (!result) throw new Error("Invalid code");
      return provider.setPassword(result.userId, newPassword);
    }

    api.post(
      "/password-reset",
      openAPIRoute(
        {
          tag: "Auth",
          summary: "Send password reset link to an email",
          description:
            "Send a password reset link to the provided email address. " +
            "If there is no user with the provided email address route will fail silently (status 200)",
          body: z.object({
            email: z.string(),
          }),
        },
        (req, res) => {
          sendResetLink(req.body.email)
            .then(() => res.status(200).json({ error: null }))
            .catch((err) =>
              res.status(500).json({ error: `${err?.message || err}` }),
            );
        },
      ),
    );

    mcp.registerTool(
      "password-reset",
      {
        title: "Request a DKG node account password reset",
        description: "Send a password reset link to the provided email address",
        inputSchema: {
          email: z.string(),
        },
      },
      async (params) => {
        const { email } = params;
        await sendResetLink(email);
        return {
          content: [
            { type: "text", text: "Password reset link sent successfully" },
          ],
        };
      },
    );

    api.post(
      "/password-reset/confirm",
      openAPIRoute(
        {
          tag: "Auth",
          summary: "Reset password using code from email",
          description:
            "Sets a new password for the user. " +
            "Fails if the code is invalid or expired.",
          body: z.object({
            code: z.string(),
            newPassword: z.string(),
          }),
        },
        (req, res) => {
          resetPassword(req.body.code, req.body.newPassword)
            .then(() => res.status(200).json({ error: null }))
            .catch((err) =>
              res.status(400).json({ error: `${err?.message || err}` }),
            );
        },
      ),
    );

    api.post(
      "/change-password",
      openAPIRoute(
        {
          tag: "Auth",
          summary: "Change password",
          description:
            "Changes the password for the user. " +
            "Fails if the old password is incorrect.",
          body: z.object({
            currentPassword: z.string(),
            newPassword: z.string(),
          }),
        },
        async (req, res) => {
          const { currentPassword, newPassword } = req.body;
          const userId = res.locals.auth?.extra?.userId;
          if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
          }

          provider
            .verifyPassword(userId, currentPassword)
            .then((valid) => {
              if (!valid) throw new Error("Wrong password.");
              return provider.setPassword(userId, newPassword);
            })
            .then(() => res.status(200).json({ error: null }))
            .catch((err) =>
              res.status(500).json({ error: `${err?.message || err}` }),
            );
        },
      ),
    );
  });
