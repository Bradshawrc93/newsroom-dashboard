/**
 * Environment configuration for newsroom dashboard
 */

export interface EnvironmentConfig {
  NODE_ENV: string;
  PORT: number;
  CORS_ORIGIN: string;
  RATE_LIMIT_ENABLED: boolean;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  LOG_LEVEL: string;
  SLACK_BOT_TOKEN?: string;
  SLACK_USER_TOKEN?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MAX_TOKENS: number;
}

const getEnvironmentConfig = (): EnvironmentConfig => {
  // Debug environment variables
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN ? 'Present' : 'Missing',
    SLACK_USER_TOKEN: process.env.SLACK_USER_TOKEN ? 'Present' : 'Missing'
  });

  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3001', 10),
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    RATE_LIMIT_ENABLED: process.env.NODE_ENV === 'production',
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    LOG_LEVEL: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
    SLACK_USER_TOKEN: process.env.SLACK_USER_TOKEN,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MAX_TOKENS: parseInt(process.env.OPENAI_MAX_TOKENS || '1000', 10),
  };
};

export const config = getEnvironmentConfig();

// Validation
export const validateEnvironment = (): void => {
  const required = ['SLACK_BOT_TOKEN', 'SLACK_USER_TOKEN'] as const;
  
  for (const key of required) {
    if (!config[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  
  // Warn about missing optional variables
  if (!config.OPENAI_API_KEY && config.NODE_ENV === 'production') {
    console.warn('Warning: OPENAI_API_KEY not set - AI features will be disabled');
  }
};

export const isDevelopment = config.NODE_ENV === 'development';
export const isProduction = config.NODE_ENV === 'production';
export const isTest = config.NODE_ENV === 'test';
