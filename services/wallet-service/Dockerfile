FROM node:20-alpine
WORKDIR /app
COPY shared ./shared
COPY services/wallet-service/package*.json ./
RUN npm install
COPY services/wallet-service .
RUN npm run build
EXPOSE 3010
CMD ["npm", "start"]
