# The Madras Diaries — no dependencies, so this stays small and fast.
FROM node:20-alpine

WORKDIR /app
COPY . .

# content/ holds everything the admin saves. Mount a volume here or edits are
# lost every time the container is replaced.
VOLUME ["/app/content"]

ENV NODE_ENV=production
ENV PORT=3000
ENV TRUST_PROXY=1

EXPOSE 3000
CMD ["node", "server.js"]
