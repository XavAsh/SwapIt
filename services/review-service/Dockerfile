FROM node:20-alpine

WORKDIR /app

# Copy shared folder first
COPY shared ./shared

# Copy service files
COPY services/review-service/package*.json ./
RUN npm install

COPY services/review-service .
RUN npm run build

EXPOSE 3007

CMD ["npm", "start"]

