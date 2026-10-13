FROM node:24.19.0-alpine
WORKDIR /app
COPY ai-relay/server.mjs ./server.mjs
USER node
EXPOSE 8787
CMD ["node", "server.mjs"]
