import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

const redactPaths = [
  "password",
  "passwordHash",
  "passwordConfirm",
  "confirmPassword",
  "newPassword",
  "currentPassword",
  "token",
  "accessToken",
  "refreshToken",
  "refresh_token",
  "access_token",
  "id_token",
  "sessionToken",
  "authorization",
  "cookie",
  "cookies",
  "req.headers.authorization",
  "req.headers.cookie",
  "headers.authorization",
  "headers.cookie",
  "*.password",
  "*.passwordHash",
  "*.token",
  "*.authorization",
  "*.cookie",
  "*.*.password",
  "*.*.token",
];

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  redact: {
    paths: redactPaths,
    censor: "[REDACTED]",
  },
  base: {
    service: "invoicerush",
    env: process.env.NODE_ENV ?? "development",
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colourise: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }),
});

export type Logger = typeof logger;

export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
