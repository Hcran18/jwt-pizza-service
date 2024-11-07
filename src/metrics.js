const config = require("./config.js");
const os = require("os");

class Metrics {
  constructor() {
    this.totalRequests = 0;
    this.getRequests = 0;
    this.postRequests = 0;
    this.putRequests = 0;
    this.deleteRequests = 0;
    this.users = 0;
    this.successAuths = 0;
    this.failedAuths = 0;
    this.startMetricsReporting();
  }

  updateUsersCount(loginBool) {
    if (loginBool) {
      this.users++;
    } else {
      this.users--;
    }
  }

  updateAuthCount(successBool) {
    if (successBool) {
      this.successAuths++;
    } else {
      this.failedAuths++;
    }
  }

  requestTracker(req, res, next) {
    this.incrementRequestCount(req.method);
    next();
  }

  incrementRequestCount(requestType) {
    this.totalRequests++;

    switch (requestType) {
      case "GET":
        this.getRequests++;
        break;
      case "POST":
        this.postRequests++;
        break;
      case "PUT":
        this.putRequests++;
        break;
      case "DELETE":
        this.deleteRequests++;
        break;
    }
  }

  startMetricsReporting() {
    const timer = setInterval(() => {
      this.reportMetrics();
    }, 10000);
    timer.unref();
  }

  getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return (cpuUsage * 100).toFixed(2);
  }

  getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return memoryUsage.toFixed(2);
  }

  reportMetrics() {
    this.sendMetricToGrafana("system", "CPU", "usage", this.getCpuUsagePercentage());
    this.sendMetricToGrafana("system", "MEM", "usage", this.getMemoryUsagePercentage());
    this.sendMetricToGrafana("request", "all", "total", this.totalRequests);
    this.sendMetricToGrafana("request", "GET", "total", this.getRequests);
    this.sendMetricToGrafana("request", "POST", "total", this.postRequests);
    this.sendMetricToGrafana("request", "PUT", "total", this.putRequests);
    this.sendMetricToGrafana("request", "DELETE", "total", this.deleteRequests);
    this.sendMetricToGrafana("user", "all", "count", this.users);
  }

  sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.metrics.source},method=${httpMethod} ${metricName}=${metricValue}`;

    fetch(`${config.metrics.url}`, {
      method: "post",
      body: metric,
      headers: { Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}` },
    })
      .then((response) => {
        if (!response.ok) {
          console.error("Failed to push metrics data to Grafana");
        } else {
          console.log(`Pushed ${metric}`);
        }
      })
      .catch((error) => {
        console.error("Error pushing metrics:", error);
      });
  }
}

const metrics = new Metrics();
module.exports = metrics;
