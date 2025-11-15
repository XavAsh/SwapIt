FROM node:20-alpine

WORKDIR /app

# Copy shared folder first
COPY shared ./shared

# Copy service files
COPY services/favorite-service/package*.json ./
RUN npm install

COPY services/favorite-service .
RUN npm run build

EXPOSE 3008

CMD ["npm", "start"]

