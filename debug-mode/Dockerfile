FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
# Intentionally insecure configuration for the CTF
ENV NODE_ENV=development
ENV CTF_SECRET=CTF{debug_mode_should_stay_off}
EXPOSE 3000
CMD ["npm", "start"]
