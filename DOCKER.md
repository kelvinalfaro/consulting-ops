# Docker usage

The native Node.js CLI is the simplest installation. Docker is available for isolated or reproducible use.

```sh
docker build -t consulting-ops .
docker run --rm -v "$PWD:/workspace" consulting-ops doctor
docker run --rm -v "$PWD:/workspace" consulting-ops scan
```

On PowerShell, replace `$PWD` with `${PWD}` in the volume expression. The mounted workspace contains private firm and opportunity data; do not bake it into the image. `docker compose run --rm consulting-ops <command>` uses the same CLI entrypoint.
