# Local infrastructure runtime smoke-test

Этот checklist завершает runtime-часть `TASK-00.02.01` после подготовки Docker Desktop/WSL2. Выполнять из корня repository в PowerShell. Локальный `.env` должен быть создан из `.env.example` и содержать только DEV credentials.

## 1. Docker runtime и Compose

```powershell
wsl --version
wsl -l -v
docker version
docker compose version
docker info
docker compose config
docker compose pull
docker compose up -d
docker compose ps
```

Ожидается: используемый WSL distribution работает в version 2, Docker Engine сообщает `OSType: linux`, Compose доступен, все пять сервисов запущены, healthchecks имеют состояние `healthy`, опубликованы только loopback ports из `docker-compose.yml`.

## 2. PostgreSQL

```powershell
docker compose exec -T postgres sh -ec 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "SELECT 1;" -c "SELECT current_user;" -c "SHOW server_version;" -c "SHOW server_encoding;"'
```

Ожидается: `SELECT 1` возвращает `1`, `current_user` совпадает с настроенным DEV user, версия соответствует pinned PostgreSQL image, `server_encoding` равен `UTF8`.

## 3. Redis

```powershell
docker compose exec -T redis sh -ec 'redis-cli --no-auth-warning -a "$REDIS_PASSWORD" PING'
```

Ожидается `PONG`. Redis используется как disposable cache и не входит в persistence proof.

## 4. RabbitMQ

```powershell
docker compose exec -T rabbitmq rabbitmq-diagnostics -q check_running
docker compose exec -T rabbitmq rabbitmq-diagnostics -q check_local_alarms
$RabbitCredential = Get-Credential -Message 'RabbitMQ DEV credentials from .env'
$RabbitAuth = @{
    Authentication = 'Basic'
    Credential = $RabbitCredential
    AllowUnencryptedAuthentication = $true
}
Invoke-RestMethod -Uri 'http://127.0.0.1:15672/api/health/checks/alarms' @RabbitAuth
```

Ожидается успешная diagnostics-проверка и management API response со status `ok`.

## 5. Keycloak

```powershell
docker compose exec -T keycloak bash -ec "{ printf 'HEAD /health/ready HTTP/1.0\r\n\r\n' >&0; grep 'HTTP/1.0 200'; } 0<>/dev/tcp/127.0.0.1/9000"
docker compose exec -T keycloak bash -ec '/opt/keycloak/bin/kcadm.sh config credentials --server http://127.0.0.1:8080 --realm master --user "$KC_BOOTSTRAP_ADMIN_USERNAME" --password "$KC_BOOTSTRAP_ADMIN_PASSWORD" --config /tmp/kcadm.config'
```

Ожидается `HTTP/1.0 200` и успешная аутентификация bootstrap admin через `kcadm.sh`. Realm, client и users приложения в этой задаче не создаются.

## 6. SeaweedFS S3 compatibility

S3 operations выполняются стандартным AWS CLI в одноразовом pinned container; устанавливать client на host не требуется. Ввести те же DEV credentials и region, что находятся в локальном `.env`; значения не сохранять в repository.

```powershell
$env:AWS_ACCESS_KEY_ID = Read-Host 'S3_ACCESS_KEY from local .env'
$env:AWS_SECRET_ACCESS_KEY = Read-Host 'S3_SECRET_KEY from local .env' -MaskInput
$S3Region = Read-Host 'S3_REGION from local .env'
$ConfiguredBucket = Read-Host 'S3_BUCKET from local .env'
$AwsCliImage = 'amazon/aws-cli:2.31.16'
$S3Endpoint = 'http://seaweedfs:8333'
$SmokeBucket = "exploitation-smoke-$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
$SmokeOutput = Join-Path $env:TEMP 'exploitation-s3-smoke'
New-Item -ItemType Directory -Path $SmokeOutput -Force | Out-Null

function Invoke-DevS3 {
    docker run --rm --network exploitation_dev `
        --env AWS_ACCESS_KEY_ID `
        --env AWS_SECRET_ACCESS_KEY `
        --volume "${PWD}:/workspace:ro" `
        --volume "${SmokeOutput}:/output" `
        $AwsCliImage `
        --endpoint-url $S3Endpoint `
        --region $S3Region `
        @args

    if ($LASTEXITCODE -ne 0) { throw 'AWS CLI S3 command failed' }
}

docker pull $AwsCliImage
Invoke-WebRequest -Uri 'http://127.0.0.1:9000' -SkipHttpErrorCheck | Select-Object StatusCode
Invoke-DevS3 s3api head-bucket --bucket $ConfiguredBucket
Invoke-DevS3 s3api create-bucket --bucket $SmokeBucket
Invoke-DevS3 s3api put-object --bucket $SmokeBucket --key smoke/README.md --body /workspace/README.md
Invoke-DevS3 s3api get-object --bucket $SmokeBucket --key smoke/README.md /output/readme.md
if ((Get-FileHash README.md).Hash -ne (Get-FileHash (Join-Path $SmokeOutput 'readme.md')).Hash) { throw 'S3 GET content mismatch' }
Invoke-DevS3 s3api delete-object --bucket $SmokeBucket --key smoke/README.md
Invoke-DevS3 s3api delete-bucket --bucket $SmokeBucket
Remove-Item -LiteralPath (Join-Path $SmokeOutput 'readme.md') -Force
```

Ожидается: endpoint отвечает S3 HTTP response, bucket создаётся, object проходит PUT/GET с совпадающим hash, затем object и bucket удаляются.

## 7. Named-volume persistence

Создать markers в PostgreSQL, RabbitMQ, Keycloak и SeaweedFS:

```powershell
docker compose exec -T postgres sh -ec 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "CREATE TABLE IF NOT EXISTS public.infrastructure_smoke (id integer PRIMARY KEY, value text NOT NULL); INSERT INTO public.infrastructure_smoke (id, value) VALUES (1, ''persists'') ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value;"'

$RabbitQueue = 'task-00.02.01-persistence-probe'
docker compose exec -T rabbitmq sh -ec 'rabbitmqadmin --username "$RABBITMQ_DEFAULT_USER" --password "$RABBITMQ_DEFAULT_PASS" --vhost "$RABBITMQ_DEFAULT_VHOST" declare queue --name task-00.02.01-persistence-probe --durable true --auto-delete false --non-interactive'

$KeycloakGroupName = 'task-00.02.01-persistence-probe'
$KeycloakAdminConfig = '/tmp/kcadm-task-00-02-01.config'
$KeycloakGroupId = docker compose exec -T keycloak bash -ec "/opt/keycloak/bin/kcadm.sh config credentials --server http://127.0.0.1:8080 --realm master --user `"`$KC_BOOTSTRAP_ADMIN_USERNAME`" --password `"`$KC_BOOTSTRAP_ADMIN_PASSWORD`" --config $KeycloakAdminConfig >/dev/null && /opt/keycloak/bin/kcadm.sh create groups -r master -s name=$KeycloakGroupName -i --config $KeycloakAdminConfig"
if ($LASTEXITCODE -ne 0) { throw 'Keycloak persistence marker creation failed' }
$KeycloakGroupId = ($KeycloakGroupId | Select-Object -Last 1).Trim()
if (-not $KeycloakGroupId) { throw 'Keycloak persistence marker ID is empty' }

$PersistenceBucket = 'exploitation-persistence-smoke'
Invoke-DevS3 s3api create-bucket --bucket $PersistenceBucket
Invoke-DevS3 s3api put-object --bucket $PersistenceBucket --key README.md --body /workspace/README.md
```

Перезапустить stack без удаления volumes:

```powershell
docker compose down
docker compose up -d
docker compose ps
```

После перехода сервисов в `healthy` проверить markers:

```powershell
docker compose exec -T postgres sh -ec 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT value FROM public.infrastructure_smoke WHERE id = 1;"'
docker compose exec -T rabbitmq sh -ec 'rabbitmqctl list_queues -p "$RABBITMQ_DEFAULT_VHOST" -q name durable' | Select-String -SimpleMatch $RabbitQueue
docker compose exec -T keycloak bash -ec "/opt/keycloak/bin/kcadm.sh config credentials --server http://127.0.0.1:8080 --realm master --user `"`$KC_BOOTSTRAP_ADMIN_USERNAME`" --password `"`$KC_BOOTSTRAP_ADMIN_PASSWORD`" --config $KeycloakAdminConfig >/dev/null && /opt/keycloak/bin/kcadm.sh get `"groups/$KeycloakGroupId`" -r master --fields id,name --config $KeycloakAdminConfig"
Invoke-DevS3 s3api head-object --bucket $PersistenceBucket --key README.md
```

Ожидаются `persists`, durable RabbitMQ queue, временная Keycloak group в существующем `master` realm и успешный S3 `head-object`. После фиксации результата удалить test data:

```powershell
docker compose exec -T postgres sh -ec 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "DROP TABLE public.infrastructure_smoke;"'
docker compose exec -T rabbitmq sh -ec 'rabbitmqadmin --username "$RABBITMQ_DEFAULT_USER" --password "$RABBITMQ_DEFAULT_PASS" --vhost "$RABBITMQ_DEFAULT_VHOST" delete queue --name task-00.02.01-persistence-probe --non-interactive'
if (docker compose exec -T rabbitmq sh -ec 'rabbitmqctl list_queues -p "$RABBITMQ_DEFAULT_VHOST" -q name' | Select-String -SimpleMatch $RabbitQueue) { throw 'RabbitMQ persistence marker cleanup failed' }
docker compose exec -T keycloak bash -ec "/opt/keycloak/bin/kcadm.sh delete `"groups/$KeycloakGroupId`" -r master --config $KeycloakAdminConfig"
$KeycloakGroupSearch = docker compose exec -T keycloak bash -ec "/opt/keycloak/bin/kcadm.sh get groups -r master -q search=$KeycloakGroupName --fields id,name --config $KeycloakAdminConfig"
if (($KeycloakGroupSearch -join "`n") -match [regex]::Escape($KeycloakGroupName)) { throw 'Keycloak persistence marker cleanup failed' }
docker compose exec -T keycloak rm -f $KeycloakAdminConfig
Invoke-DevS3 s3api delete-object --bucket $PersistenceBucket --key README.md
Invoke-DevS3 s3api delete-bucket --bucket $PersistenceBucket
Remove-Item -LiteralPath $SmokeOutput -Recurse -Force
Remove-Item Env:AWS_ACCESS_KEY_ID, Env:AWS_SECRET_ACCESS_KEY -ErrorAction SilentlyContinue
```

Не выполнять `docker compose down -v`: эта команда удаляет named volumes и делает persistence test недостоверным.

## 8. Build regression

```powershell
dotnet restore Exploitation.sln
dotnet build Exploitation.sln -c Release
dotnet test Exploitation.sln -c Release
```

Ожидается успешное завершение всех трёх команд без ошибок.
