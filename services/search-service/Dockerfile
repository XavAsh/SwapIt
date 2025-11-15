FROM node:20-alpine

WORKDIR /app

# Copy shared folder first
COPY shared ./shared

# Copy service files
COPY services/search-service/package*.json ./
RUN npm install

COPY services/search-service .
RUN npm run build

EXPOSE 3003

CMD ["npm", "start"]

