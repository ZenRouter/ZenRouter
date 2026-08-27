docker stop zenroute
docker rm zenroute
docker build -t zenroute .
docker run -d --name zenroute -p 20128:20128 --env-file .env -v zenroute-data:/app/data zenroute