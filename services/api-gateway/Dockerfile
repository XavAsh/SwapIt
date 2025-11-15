FROM node:20-alpine

WORKDIR /app

# Copy service files
COPY services/api-gateway/package*.json ./
RUN npm install

COPY services/api-gateway .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]

