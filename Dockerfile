FROM node:20

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Recompilar esbuild para que coincida la versión binaria con la del entorno
RUN npm rebuild esbuild

RUN npm run build

# Servir el build con un servidor estático
RUN npm install -g serve
CMD ["npm", "run", "dev", "--", "--host"]