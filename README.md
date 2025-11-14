# Inside Notes v2

## Overview

Projeto de aplicação de notas com backend em Node.js/Express e frontend em React + Vite.

## Deploy no Coolify

- Certifique-se de criar um arquivo `.env` com as variáveis necessárias para o backend e frontend.
- Configure o docker-compose.yml para orquestrar os serviços.
- O banco de dados PostgreSQL é configurado via serviço `db`.
- O backend depende do banco e do proxy.
- O proxy serve o frontend e redireciona para o backend.

## Variáveis de ambiente necessárias

- PG_USER
- PG_PASSWORD
- PG_DATABASE
- JWT_SECRET

## Comandos úteis

- `docker-compose up --build` para buildar e subir os containers
- `docker-compose down` para parar os containers
