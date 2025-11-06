#!/bin/bash

# Script para iniciar o projeto com Docker e obter URLs do LocalTunnel

echo "🚀 Iniciando containers Docker..."
docker-compose up -d --build

echo "⏳ Aguardando serviços iniciarem..."
sleep 10

echo "📋 URLs dos serviços:"
echo ""
echo "🔵 Backend Local: http://localhost:3000"
echo "🟢 Frontend Local: http://localhost"
echo ""

echo "🌐 URLs Públicas (LocalTunnel):"
echo ""
echo "Para iniciar os tunnels, execute em terminal separado:"
echo "./start-tunnels.sh"
echo ""
echo "Ou manualmente:"
echo "npx localtunnel --port 8081 --subdomain kanbar-dashboard-api"
echo "npx localtunnel --port 80 --subdomain kanbar-dashboard"
echo ""

echo "✅ Serviços iniciados!"
echo ""
echo "Para ver logs: docker-compose logs -f"
echo "Para parar: docker-compose down"

