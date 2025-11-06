#!/bin/bash

# Script para iniciar LocalTunnel depois dos containers estarem a correr
# Este script deve ser executado no host (não dentro do Docker)

echo "🌐 Aguardando serviços iniciarem..."
sleep 10

echo "📡 A iniciar LocalTunnel para backend..."
npx localtunnel --port 8081 --subdomain kanbar-dashboard-api &
BACKEND_TUNNEL_PID=$!

echo "📡 A iniciar LocalTunnel para frontend..."
npx localtunnel --port 80 --subdomain kanbar-dashboard &
FRONTEND_TUNNEL_PID=$!

echo "✅ Tunnels iniciados!"
echo "Backend PID: $BACKEND_TUNNEL_PID"
echo "Frontend PID: $FRONTEND_TUNNEL_PID"
echo ""
echo "URLs:"
echo "Backend: https://kanbar-dashboard-api.loca.lt"
echo "Frontend: https://kanbar-dashboard.loca.lt"
echo ""
echo "Pressione Ctrl+C para parar os tunnels"

# Aguardar por interrupção
trap "kill $BACKEND_TUNNEL_PID $FRONTEND_TUNNEL_PID; exit" INT TERM
wait

