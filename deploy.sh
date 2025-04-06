aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 337392631707.dkr.ecr.us-east-1.amazonaws.com
docker tag seal:latest 337392631707.dkr.ecr.us-east-1.amazonaws.com/seal:latest
docker push 337392631707.dkr.ecr.us-east-1.amazonaws.com/seal:latest




