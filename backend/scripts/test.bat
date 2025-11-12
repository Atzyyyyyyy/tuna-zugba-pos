@echo off
echo ================================================
echo 🧪 Running Tuna Zugba Backend CI Test Simulation
echo ================================================
cd /d C:\tuna-zugba-pos\backend

echo.
echo 🚀 Running migrations...
php artisan migrate:fresh --seed

echo.
echo 🧩 Running Laravel Feature Tests...
php artisan test

echo.
echo ✅ Tests completed.
pause
