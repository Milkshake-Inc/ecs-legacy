FROM node:latest

WORKDIR /usr/src/app

COPY . /usr/src/app

RUN yarn --frozen-lockfile

# RUN yarn build

WORKDIR /usr/src/app/

EXPOSE 3000

CMD ["yarn", "start"]
