FROM node:20-alpine
WORKDIR /app
COPY shared ./shared
COPY services/admin-service/package*.json ./
RUN npm install
COPY services/admin-service .
RUN npm run build
EXPOSE 3011
CMD ["npm", "start"]
