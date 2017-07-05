FROM registry.njuics.cn/nap/dcos-ui-base

COPY . /dcos-ui
WORKDIR /dcos-ui

RUN npm install && \
    npm run build-assets
