FROM ghcr.io/lowlighter/metrics@sha256:257392f90340f916cb8b815026f259399f6b246d3eb7de38b58bfe7a07bd5b65

COPY patch-metrics.cjs /tmp/patch-metrics.cjs
COPY icons /metrics/source/plugins/languages/icons
RUN node /tmp/patch-metrics.cjs
