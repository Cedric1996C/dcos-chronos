FROM ubuntu

ENV NODE_VERSION="4.4.7" \
    NPM_VERSION="3.9"

RUN set -x \
    && apt-get update \
    && apt-get install -y curl git bzip2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*$ \

    # Install node 4.4.7 & npm 3.9
    && curl -o- https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz | tar -C /usr/local --strip-components=1 -zx \
    && npm install -g npm@${NPM_VERSION}

