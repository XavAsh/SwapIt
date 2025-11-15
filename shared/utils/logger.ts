export class Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  info(message: string, data?: any) {
    console.log(`[${this.serviceName}] [INFO] ${message}`, data || "");
  }

  error(message: string, error?: any) {
    console.error(`[${this.serviceName}] [ERROR] ${message}`, error || "");
  }

  warn(message: string, data?: any) {
    console.warn(`[${this.serviceName}] [WARN] ${message}`, data || "");
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[${this.serviceName}] [DEBUG] ${message}`, data || "");
    }
  }
}
