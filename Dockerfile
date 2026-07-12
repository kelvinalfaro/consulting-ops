FROM node:22-alpine

WORKDIR /opt/consulting-ops
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm link

WORKDIR /workspace
ENTRYPOINT ["consulting-ops"]
CMD ["--help"]
