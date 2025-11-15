FROM node:20-alpine

WORKDIR /app

# Copy shared folder first
COPY shared ./shared

# Copy service files
COPY services/user-service/package*.json ./
RUN npm install

COPY services/user-service .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]

