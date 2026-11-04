declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    AUTH_BASE_URL?: string;
    WEZEL_LOCAL_SETUP?: string;
    AUTH_MODE?: "platform"|"migration"|"local";
    BETTER_AUTH_SECRET?: string;
    AUTH_EMAIL_FROM?: string;
    RESEND_API_KEY?: string;
    OWNER_EMAIL?: string;
    BUCKET?: R2Bucket;
  }
}
