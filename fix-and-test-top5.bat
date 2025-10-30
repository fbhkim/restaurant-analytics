@echo off
echo CORRIGINDO E TESTANDO TOP 5 PRODUTOS
echo ===================================

echo 1. Iniciando containers...
docker-compose up -d

echo 2. Aguardando PostgreSQL (30 segundos)...
timeout /t 30 /nobreak >nul

echo 3. Verificando containers...
docker-compose ps

echo 4. Testando conexão com banco...
docker-compose exec postgres pg_isready -U postgres

echo 5. Verificando order_items...
docker-compose exec postgres psql -U postgres -d restaurant_analytics -c "SELECT COUNT(*) FROM order_items;"

echo 6. Testando API - Top 5 Produtos...
curl -s http://localhost:8000/api/quick-insights

echo.
echo ✅ TESTE CONCLUÍDO!
echo Acesse: http://localhost:3000
pause