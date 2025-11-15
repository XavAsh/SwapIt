FROM node:20-alpine

WORKDIR /app

# Copy shared folder first
COPY shared ./shared

# Copy service files
COPY services/messaging-service/package*.json ./
RUN npm install

COPY services/messaging-service .
RUN npm run build

EXPOSE 3004

CMD ["npm", "start"]

