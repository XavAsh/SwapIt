FROM node:20-alpine

WORKDIR /app

# Copy shared folder first
COPY shared ./shared

# Copy service files
COPY services/catalog-service/package*.json ./
RUN npm install

COPY services/catalog-service .
RUN npm run build

EXPOSE 3002

CMD ["npm", "start"]

