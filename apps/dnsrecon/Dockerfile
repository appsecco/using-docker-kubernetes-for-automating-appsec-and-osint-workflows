FROM python:2.7-alpine
LABEL MAINTAINER="Appsecco"

RUN apk update && apk add git \
    && git clone https://github.com/darkoperator/dnsrecon.git \
    && apk add --update --no-cache g++ gcc libxslt-dev

WORKDIR /dnsrecon

RUN pip install -r requirements.txt

ENTRYPOINT [ "python", "/dnsrecon/dnsrecon.py" ]