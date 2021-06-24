FROM trion/ng-cli-karma AS ng-builder
WORKDIR /src
COPY ./embc-registrant/package*.json ./
RUN npm install
COPY ./embc-registrant/ .
RUN npm run lint
RUN npm run test -- --no-watch --no-progress
RUN npm run build -- --prod

FROM caddy:alpine as final
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=ng-builder /src/dist/embc-registrant/ /site
ENV API_URL=
ENV LOG_LEVEL=INFO
EXPOSE 2015