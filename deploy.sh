#!/bin/bash

# Definir a versão
VERSION="0.1.1"

# Verificar variáveis de ambiente
if [ -z "$DOCKER_PAT" ] || [ -z "$DOCKER_USERNAME" ]; then
    echo "Erro: Variáveis de ambiente DOCKER_PAT e/ou DOCKER_USERNAME não definidas"
    exit 1
fi

# Limpar cache do yarn e instalar dependências
echo "Instalando dependências..."
yarn cache clean
yarn install

# Fazer login no Docker Hub
echo "Fazendo login no Docker Hub..."
echo "$DOCKER_PAT" | docker login -u "$DOCKER_USERNAME" --password-stdin

# Construir a imagem
echo "Construindo a imagem..."
docker build -t "$DOCKER_USERNAME/many-ia:latest" .
docker tag "$DOCKER_USERNAME/many-ia:latest" "$DOCKER_USERNAME/many-ia:$VERSION"

# Enviar as imagens
echo "Enviando as imagens para o Docker Hub..."
docker push "$DOCKER_USERNAME/many-ia:latest"
docker push "$DOCKER_USERNAME/many-ia:$VERSION"

echo "Deploy concluído com sucesso!" 