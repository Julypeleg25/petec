class LoggerService {
  constructor() { }

  public debug(message: string): void {
    console.log(`DEBUG: ${message}`);
  }

  public info(message: string): void {
    // console.log(`INFO: ${message}`);
  }

  public error(message: string): void {
    console.error(`ERROR: ${message}`);
  }
}

const logger = new LoggerService();
export default logger;
