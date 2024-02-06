FROM node:14 as builder
RUN mkdir -p /usr/src/app/
WORKDIR /usr/src/app/
COPY package*.json /usr/src/app/
RUN npm set progress=false
RUN npm ci --only=production
RUN npm cache verify
COPY . /usr/src/app/

# Production Final Stage
FROM keymetrics/pm2:14-stretch
ENV NODE_ENV="production"
RUN mkdir -p /usr/src/app/
WORKDIR /usr/src/app/
COPY --from=builder /usr/src/app/ /usr/src/app/
EXPOSE 3030
CMD ["pm2-runtime", "--json", "process.yml"]
