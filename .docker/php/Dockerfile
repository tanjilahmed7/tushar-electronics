FROM php:8.4-fpm

COPY php.ini /usr/local/etc/php/php.ini
COPY docker.conf /usr/local/etc/php-fpm.d/docker.conf

COPY start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh

# Build deps + MySQL (no PostgreSQL)
RUN apt-get update \
  && apt-get install -y build-essential zlib1g-dev curl gnupg procps vim git unzip libzip-dev default-libmysqlclient-dev \
  && docker-php-ext-install zip pdo_mysql mysqli

# intl
RUN apt-get install -y libicu-dev \
  && docker-php-ext-configure intl \
  && docker-php-ext-install intl

# gd
RUN apt-get install -y libfreetype6-dev libjpeg62-turbo-dev libpng-dev && \
  docker-php-ext-configure gd --with-freetype=/usr/include/ --with-jpeg=/usr/include/ && \
  docker-php-ext-install gd

# redis, bcmath, pcntl, opcache
RUN pecl install redis && docker-php-ext-enable redis
RUN docker-php-ext-install bcmath pcntl opcache exif

# Node.js & npm (for Vite/frontend build)
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs npm \
  && corepack enable
ENV PATH="/usr/share/nodejs/corepack/shims:$PATH"

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
ENV COMPOSER_ALLOW_SUPERUSER=1
ENV COMPOSER_HOME=/composer
ENV PATH=$PATH:/composer/vendor/bin
RUN composer config --global process-timeout 3600

# Supervisor
RUN apt-get install -y supervisor

WORKDIR /var/www
EXPOSE 9000

ENTRYPOINT ["start.sh"]
