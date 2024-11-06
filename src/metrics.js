const config = require("./config.js");
const os = require("os");

class Metrics {
  constructor() {
    this.totalRequests = 0;
    this.getRequests = 0;
    this.postRequests = 0;
    this.putRequests = 0;
    this.deleteRequests = 0;
    this.startMetricsReporting();
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
    this.sendMetricToGrafana("system", "GET", "cpu_usage", this.getCpuUsagePercentage());
    this.sendMetricToGrafana("system", "GET", "memory_usage", this.getMemoryUsagePercentage());
    this.sendMetricToGrafana("request", "all", "total_requests", this.totalRequests);
    this.sendMetricToGrafana("request", "GET", "get_requests", this.getRequests);
    this.sendMetricToGrafana("request", "POST", "post_requests", this.postRequests);
    this.sendMetricToGrafana("request", "PUT", "put_requests", this.putRequests);
    this.sendMetricToGrafana("request", "DELETE", "delete_requests", this.deleteRequests);
  }

  sendMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.source},method=${httpMethod} ${metricName}=${metricValue}`;

    fetch(`${config.url}`, {
      method: "post",
      body: metric,
      headers: { Authorization: `Bearer ${config.userId}:${config.apiKey}` },
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
