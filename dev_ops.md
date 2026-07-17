Note : currently the fastapi container is hosted on azure and the react app is hosted on vercel. The react app is configured to use the fastapi container as the backend API.

sudo docker build -t share-fastly-fastapi:v1 .
<!-- sudo docker build -t share-fastly-react:v1 . -->

docker run --env-file .env -p 8000:8000 share-fastly-fastapi:v1
<!-- docker run -e VITE_API_BASE_URL=https://share-fastly-fastapi-cgcad2gdb3ddgtfc.centralindia-01.azurewebsites.net -p 3000:80 share-fastly-react:v1 -->