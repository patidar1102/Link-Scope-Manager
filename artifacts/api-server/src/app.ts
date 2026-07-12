import express, { type Express } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import redirectRouter from "./routes/redirect.js";
import router from "./routes/index";

import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

// Behind Replit's proxy — trust X-Forwarded-* headers so req.protocol and
// the client IP extraction (used for geo lookup / visitor hashing) are
// correct rather than always resolving to the proxy's own address.
app.set("trust proxy", true);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY,
    ),
  })),
);

// Clean short-link redirects (/s/:code) and legacy redirects (/r/:code) are
// plain server-rendered routes, mounted at the root — browsers navigate to
// them directly rather than the SPA calling them via fetch.
app.use(redirectRouter);

app.use("/api", router);

export default app;
