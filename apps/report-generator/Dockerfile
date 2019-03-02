FROM node:10.15.1-stretch-slim
LABEL MAINTAINER "Appsecco"

ENV PATH $PATH:/root/google-cloud-sdk/bin
RUN apt-get update && apt-get install -y python curl bash build-essential wget \
	&& wget https://dl.minio.io/client/mc/release/linux-amd64/mc && chmod +x mc \
    	&& mv mc /usr/bin/mc
	
RUN curl -sSL https://sdk.cloud.google.com | bash

WORKDIR /app

COPY site.tar.gz .
COPY splat-sidecar .
COPY handler.sh .

RUN tar xzvf site.tar.gz && cd site-legacy && cd /app/site-legacy/ && npm install  \
  && cd .. && chmod 755 splat-sidecar handler.sh
