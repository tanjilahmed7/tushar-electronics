# Docker setup (same structure as userback-app)

PHP 8.4 FPM, Nginx, MySQL 8, Redis. Layout mirrors userback-app; database is MySQL.

## Structure

```
.docker/
├── php/
│   ├── Dockerfile          # PHP 8.4 FPM, pdo_mysql, redis, gd, Node, Composer, Supervisor
│   ├── php.ini
│   ├── docker.conf
│   ├── start.sh            # Wait for DB, then Supervisor + php-fpm
│   ├── supervisor/
│   │   └── supervisord.conf # queue:work redis + schedule:work
│   └── scripts/
│       └── queue-manager.sh
├── nginx/
│   ├── default.conf
│   └── nginx.conf
├── redis/
│   ├── redis.conf
│   └── data/               # Redis data (create if needed)
└── db/                     # Not used; MySQL uses named volume mysql_data

docker-compose.yml           # php, nginx, db (mysql), redis
env.docker.example
```

## Quick start

1. **Environment**
   ```bash
   cp env.docker.example .env
   php artisan key:generate   # or set APP_KEY in .env
   ```

2. **Dependencies and build** (on host or inside container)
   ```bash
   composer install
   npm ci && npm run build
   ```

3. **Build and run**
   ```bash
   docker compose build
   docker compose up -d
   ```

4. **Migrations**
   ```bash
   docker compose exec php php artisan migrate
   ```

5. **Open**: http://localhost:8000

## Commands

| Action   | Command |
|----------|---------|
| Build    | `docker compose build` |
| Start    | `docker compose up -d` |
| Stop     | `docker compose down` |
| Logs     | `docker compose logs -f php` |
| Shell    | `docker compose exec php bash` |
| Artisan  | `docker compose exec php php artisan <cmd>` |
| Queue    | `docker compose exec php /var/www/.docker/php/scripts/queue-manager.sh status` |

## Ports

- **8000** → Nginx
- **3306** → MySQL
- **6380** → Redis (host; set `REDIS_PORT` in `.env` if 6380 is in use)

## Queue / scheduler

Supervisor runs `queue:work redis` and `schedule:work` in the **php** container. Set `QUEUE_CONNECTION=redis` in `.env` (as in env.docker.example).
