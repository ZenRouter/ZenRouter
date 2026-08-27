docker stop zenrouter
docker rm zenrouter
docker build -t zenrouter .
docker run -d --name zenrouter -p 20128:20128 --env-file .env -v zenrouter-data:/app/data zenrouter