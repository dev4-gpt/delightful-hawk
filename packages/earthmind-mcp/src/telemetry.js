/**
 * Structured logging utility.
 * @module telemetry
 */

const createLogEntry = (level, msg, meta = {}) => {
  return JSON.stringify({
    level,
    time: new Date().toISOString(),
    msg,
    ...meta
  });
};

export const logger = {
  info: (msg, meta) => process.stderr.write(createLogEntry('info', msg, meta) + '\n'),
  warn: (msg, meta) => process.stderr.write(createLogEntry('warn', msg, meta) + '\n'),
  error: (msg, meta) => process.stderr.write(createLogEntry('error', msg, meta) + '\n'),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production') {
      process.stderr.write(createLogEntry('debug', msg, meta) + '\n');
    }
  }
};

export function trackToolExecution(toolName, durationMs, success, clientId) {
  logger.info(`Tool execution: ${toolName}`, {
    toolName,
    durationMs,
    success,
    clientId,
    type: 'tool_execution_metric'
  });
}
