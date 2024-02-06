# build environment
FROM node:12 as build
WORKDIR /app
ARG REACT_APP_VERSION
ARG REACT_APP_LOGS
ARG REACT_APP_API_URL
ARG REACT_APP_WEBSOCKET_URL
ARG REACT_APP_WEBSOCKET_PATH
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock
RUN yarn install --silent
RUN yarn global add react-scripts@4.0.3 -g --silent
COPY . /app
RUN yarn run build

# production environment
FROM nginx:1.16.0-alpine
COPY --from=build /app/build /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx/nginx.conf /etc/nginx/conf.d
CMD ["nginx", "-g", "daemon off;"]
