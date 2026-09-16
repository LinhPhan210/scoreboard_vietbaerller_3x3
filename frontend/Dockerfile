# Use nginx to serve static files
FROM nginx:alpine

# Build metadata (passed in via --build-arg, see docker-compose.yml)
ARG GIT_SHA=unknown
ARG BUILD_DATE=unknown

# Copy static files to nginx html directory
COPY app/ /usr/share/nginx/html/

# Stamp the build with commit + timestamp so the UI can show which deploy is live
RUN echo "{\"sha\":\"${GIT_SHA}\",\"date\":\"${BUILD_DATE}\"}" > /usr/share/nginx/html/build-info.json

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
