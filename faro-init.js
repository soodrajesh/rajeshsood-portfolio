// Grafana Faro (Real User Monitoring) — captures real visitor page loads, Core
// Web Vitals, JS errors, and end-to-end HTTP trace timing. Loaded as an external
// module (not an inline <script>) so it stays within the existing strict CSP's
// script-src 'self' without needing a new sha256 hash. Depends on
// faro-web-sdk.iife.js and faro-web-tracing.iife.js loading first.
window.GrafanaFaroWebSdk.initializeFaro({
  url: 'https://faro-collector-prod-eu-west-6.grafana.net/collect/c26ec8ba5f908acd9462b4a33269d89c',
  app: {
    name: 'irajeshsood.com',
    version: '1.0.0',
    environment: 'production',
  },
  instrumentations: [
    ...window.GrafanaFaroWebSdk.getWebInstrumentations(),
    new window.GrafanaFaroWebTracing.TracingInstrumentation(),
  ],
});
