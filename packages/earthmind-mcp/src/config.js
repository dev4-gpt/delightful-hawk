/**
 * Environment configuration loader.
 * @module config
 */

export const CONFIG = Object.freeze({
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || '127.0.0.1',
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '120', 10),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  BQ_DATASET: process.env.BQ_DATASET || 'aetheris',
  GCP_PROJECT_ID: process.env.GCP_PROJECT_ID || 'aetheris-prod',
  NODE_ENV: process.env.NODE_ENV || 'development'
});
