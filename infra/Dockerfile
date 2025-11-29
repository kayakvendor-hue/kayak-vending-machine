FROM node:14

WORKDIR /usr/src/app

COPY backend/package*.json ./

RUN npm install

COPY backend/src ./src

COPY frontend/package*.json ../frontend/

RUN cd ../frontend && npm install

EXPOSE 3000

CMD ["npm", "start"]