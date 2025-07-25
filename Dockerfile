FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production || true
COPY server.js ./
COPY kafka ./kafka
EXPOSE 3000
CMD ["npm", "start"] 