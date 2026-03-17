FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY src/ ./src/
COPY www/ ./www/
COPY student_id.txt ./

ARG BUILD_TIME
RUN if [ -z "$BUILD_TIME" ]; then \
      BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ"); \
    fi && \
    echo "$BUILD_TIME" > /app/build_time.txt && \
    echo "Build Time: $BUILD_TIME"

ENV STUDENT_ID_FILE=/app/student_id.txt
ENV BUILD_TIME_FILE=/app/build_time.txt
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "src/index.js"]