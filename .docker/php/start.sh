#!/bin/bash

echo "🚀 Starting Tushar Electronics..."

chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
chmod -R 775 /var/www/storage /var/www/bootstrap/cache

mkdir -p /var/log/supervisor
chown -R www-data:www-data /var/log/supervisor

if [ -f /var/www/.docker/php/scripts/queue-manager.sh ]; then
  chmod +x /var/www/.docker/php/scripts/queue-manager.sh
fi

echo "⏳ Waiting for database..."
cd /var/www

while ! php -r "
    require_once 'vendor/autoload.php';
    \$app = require_once 'bootstrap/app.php';
    \$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
    try {
        DB::connection()->getPdo();
        echo 'Database OK\n';
        exit(0);
    } catch (Exception \$e) {
        exit(1);
    }
" 2>/dev/null; do
  echo "⏳ Database not ready, waiting 5s..."
  sleep 5
done

echo "✅ Database is ready!"

if [ -f /var/www/.docker/php/supervisor/supervisord.conf ]; then
  echo "🚀 Starting Supervisor..."
  /usr/bin/supervisord -c /var/www/.docker/php/supervisor/supervisord.conf &
  sleep 3
  [ -S /var/run/supervisor.sock ] && supervisorctl status || true
fi

echo "🚀 Starting PHP-FPM..."
exec php-fpm -F
