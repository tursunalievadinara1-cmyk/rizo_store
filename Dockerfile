FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --chown=node:node package.json server.mjs index.html styles.css app.js barcode.min.js barcode-LICENSE.txt ./
USER node
CMD ["node", "server.mjs"]
