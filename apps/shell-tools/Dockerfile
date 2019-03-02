FROM ubuntu
LABEL MAINTAINER "Appsecco"

RUN apt-get update && apt-get install wget ruby ruby-dev build-essential curl vim -y \
    && wget https://dl.minio.io/client/mc/release/linux-amd64/mc && chmod +x mc \
    && mv mc /usr/bin/mc \
    && gem install nats

COPY splat-sidecar /usr/bin/splat-sidecar
