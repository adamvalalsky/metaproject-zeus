ARG BASE_IMAGE=node:21-alpine3.17

FROM $BASE_IMAGE AS node_modules

COPY api/package*.json /app/api/
RUN \
	cd /app/api &&\
	npm install

FROM $BASE_IMAGE AS dev

WORKDIR /app/api

ENV NODE_ENV=development

# ----- copy shared modules
COPY shared/ /app/shared

# ----- copy node_modules for API
COPY --from=node_modules /app/api/node_modules /app/api/node_modules

# ---- copy API files
COPY api/tsconfig*.json /app/api/
COPY api/nest-cli.json /app/api

COPY api/config /app/api/config
COPY api/src /app/api/src

ENTRYPOINT npm run start:dev
