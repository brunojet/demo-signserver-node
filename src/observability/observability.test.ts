import { WinstonLogger } from './observability';
import winston from 'winston';

jest.mock('winston', () => {
  const mLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  return {
    createLogger: jest.fn(() => mLogger),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      json: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
    },
  };
});

describe('WinstonLogger', () => {
  let logger: WinstonLogger;
  let mLogger: any;

  beforeEach(() => {
    logger = new WinstonLogger();
    mLogger = (winston.createLogger as jest.Mock).mock.results[0].value;
  });

  it('calls info', () => {
    logger.info('info', { foo: 'bar' });
    expect(mLogger.info).toHaveBeenCalledWith('info', { foo: 'bar' });
  });

  it('calls warn', () => {
    logger.warn('warn', { foo: 'bar' });
    expect(mLogger.warn).toHaveBeenCalledWith('warn', { foo: 'bar' });
  });

  it('calls error', () => {
    logger.error('error', { foo: 'bar' });
    expect(mLogger.error).toHaveBeenCalledWith('error', { foo: 'bar' });
  });

  it('calls debug', () => {
    logger.debug('debug', { foo: 'bar' });
    expect(mLogger.debug).toHaveBeenCalledWith('debug', { foo: 'bar' });
  });
});
