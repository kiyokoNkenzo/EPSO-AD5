FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 reminder \
    && useradd --uid 10001 --gid reminder --no-create-home --shell /usr/sbin/nologin reminder

WORKDIR /app
COPY --chown=reminder:reminder reminder.py /app/reminder.py

USER 10001:10001
STOPSIGNAL SIGTERM

ENTRYPOINT ["python", "/app/reminder.py"]
