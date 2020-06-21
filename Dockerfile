FROM node:12
COPY . /home
WORKDIR /home
RUN npm ci
RUN npm run serve