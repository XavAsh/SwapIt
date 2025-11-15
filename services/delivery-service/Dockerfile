FROM node:20-alpine

WORKDIR /app

# Copy shared folder first
COPY shared ./shared

# Copy service files
COPY services/delivery-service/package*.json ./
RUN npm install

COPY services/delivery-service .
RUN npm run build

EXPOSE 3009

CMD ["npm", "start"]

