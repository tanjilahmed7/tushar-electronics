#!/bin/bash
WORKER="laravel-worker"
SCHEDULER="laravel-scheduler"

case "$1" in
    start)
        supervisorctl start $WORKER $SCHEDULER
        ;;
    stop)
        supervisorctl stop $WORKER $SCHEDULER
        ;;
    restart)
        supervisorctl restart $WORKER $SCHEDULER
        ;;
    status)
        supervisorctl status
        ;;
    logs)
        tail -f /var/log/supervisor/worker.log
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac
