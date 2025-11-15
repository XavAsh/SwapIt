FROM node:20-alpine

WORKDIR /app

# Copy shared folder first
COPY shared ./shared

# Copy service files
COPY services/notification-service/package*.json ./
RUN npm install

COPY services/notification-service .
RUN npm run build

EXPOSE 3006

CMD ["npm", "start"]

