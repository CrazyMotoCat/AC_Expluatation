# DEV stack reset

`scripts/dev/dev-reset.ps1` удаляет named volumes, определённые в локальном `docker-compose.yml`, и по умолчанию снова поднимает stack. Это удаляет данные PostgreSQL, RabbitMQ, Keycloak и SeaweedFS из локальной Development-среды.

Команда не принимает environment, отличный от `Development`. Она также откажется выполняться, если заданные `ASPNETCORE_ENVIRONMENT` или `DOTNET_ENVIRONMENT` имеют любое другое значение. Все DEV scripts принимают только local Docker endpoint (Windows named pipe, Unix socket или loopback TCP) и отклоняют remote Docker context. Указывайте явное подтверждение:

```powershell
./scripts/dev/dev-reset.ps1 -Environment Development -ConfirmReset
```

Перед удалением проверьте план без изменения Docker state:

```powershell
./scripts/dev/dev-reset.ps1 -Environment Development -ConfirmReset -WhatIf
```

Чтобы удалить local DEV volumes, но не перезапускать services, добавьте `-SkipRestart`.

Обычная остановка среды выполняется через `scripts/dev/dev-down.ps1` и не удаляет volumes.
