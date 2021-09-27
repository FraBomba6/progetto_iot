#!/bin/sh
chmod 700 -R /var/lib/postgresql/12/main
chown -R postgres:postgres /var/lib/postgresql/12/main
if [ -z "$(ls -A /var/lib/postgresql/12/main)" ]; then
  su - postgres -c '/usr/lib/postgresql/12/bin/pg_ctl -D /usr/local/pgsql/data initdb -D /var/lib/postgresql/12/main'
fi

service postgresql start

if ! su - postgres -c 'psql -lqt | cut -d \| -f 1 | grep -qw iot'; then
  su - postgres -c 'createdb iot'
fi

sudo -u postgres 'psql' 'iot' "-c ALTER USER postgres PASSWORD 'pass';"
if ! sudo -u postgres 'psql' 'iot' "-c SELECT to_regclass('public.messages');" | grep -q "messages"; then
  sudo -u postgres 'psql' 'iot' "-c CREATE TABLE messages(id TEXT, sequence INTEGER, msg JSON, PRIMARY KEY (id, sequence));"
fi

service rabbitmq-server start
sudo rabbitmq-plugins enable rabbitmq_management
sudo pm2-runtime start logger.js

