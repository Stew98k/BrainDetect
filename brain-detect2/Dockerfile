# ===== STAGE 1: build con Node =====
FROM node:20-alpine AS build

# cartella di lavoro dentro il container
WORKDIR /app

# copia solo i file di dipendenze
COPY package*.json ./

# installa le dipendenze (usa ci per essere ripetibile)
RUN npm ci

# copia il resto del codice
COPY . .

# build della SPA (usa lo script di Vite: "build")
RUN npm run build

# ===== STAGE 2: serve con Nginx =====
FROM nginx:1.27-alpine AS runtime

# cancello la config di default di nginx
RUN rm /etc/nginx/conf.d/default.conf

# copio la nostra config custom
COPY nginx.conf /etc/nginx/conf.d/default.conf

# copio i file buildati da Vite
COPY --from=build /app/dist /usr/share/nginx/html

# porta esposta (internamente al container)
EXPOSE 80

# comando di avvio
CMD ["nginx", "-g", "daemon off;"]
