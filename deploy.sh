git fetch && git reset --hard origin/golf
yarn && yarn build
PORT=80 docker-compose up -d --force-recreate
