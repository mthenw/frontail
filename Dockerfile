FROM node:12-stretch-slim

WORKDIR /frontail
ADD . .
RUN npm install --production

ENTRYPOINT ["/frontail/docker-entrypoint.sh"]
EXPOSE 9001
CMD ["--help"]
