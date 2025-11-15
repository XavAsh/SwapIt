FROM node:20-alpine

WORKDIR /app

# Copy shared folder first
COPY shared ./shared

# Copy service files
COPY services/transaction-service/package*.json ./
RUN npm install

COPY services/transaction-service .
RUN npm run build

EXPOSE 3005

CMD ["npm", "start"]

