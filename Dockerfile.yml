FROM node:20

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN npm run build

# Servir el build con un servidor estático
RUN npm install -g serve
CMD ["npm", "run", "dev", "--", "--host"]