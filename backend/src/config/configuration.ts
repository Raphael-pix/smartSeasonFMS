export const configuration = () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    name: process.env.APP_NAME ?? 'SmartSeason API',
  },

  supabase: {
    url: process.env.SUPABASE_URL!,
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY!,
    jwtSecret: process.env.SUPABASE_JWT_SECRET!,
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? 'field-images',
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? undefined,
  },

  cache: {
    ttlFieldStatus: parseInt(process.env.CACHE_TTL_FIELD_STATUS ?? '300', 10),
    ttlDashboard: parseInt(process.env.CACHE_TTL_DASHBOARD ?? '120', 10),
    ttlFieldList: parseInt(process.env.CACHE_TTL_FIELD_LIST ?? '60', 10),
  },

  fieldStatus: {
    atRiskThresholdDays: parseInt(
      process.env.AT_RISK_THRESHOLD_DAYS ?? '7',
      10,
    ),
  },

  upload: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB ?? '5', 10),
    allowedMimeTypes: (
      process.env.ALLOWED_MIME_TYPES ?? 'image/jpeg,image/png,image/webp'
    ).split(','),
  },

  bull: {
    dashboardUsername: process.env.BULL_DASHBOARD_USERNAME ?? 'admin',
    dashboardPassword: process.env.BULL_DASHBOARD_PASSWORD ?? 'secret',
  },
});

export type AppConfig = ReturnType<typeof configuration>;
