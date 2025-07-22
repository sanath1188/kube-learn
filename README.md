# kube-learn Node.js Server on Kubernetes

This project demonstrates a simple Node.js HTTP server deployed to Kubernetes using Docker Desktop on macOS.

## Prerequisites

- Docker Desktop with Kubernetes enabled
- Node.js and npm
- kubectl
- (Optional) Helm

## 1. Build the Node.js Server

```
npm install
```

## 2. Build the Docker Image

```
docker build -t node-server:latest .
```

## 3. Tag the Image for Local Kubernetes Use

```
docker tag node-server:latest node-server:local
```

## 4. Set Kubernetes Context

Make sure you are using the `docker-desktop` context:

```
kubectl config use-context docker-desktop
```

## 5. Deploy to Kubernetes (kubectl)

### Update the Deployment (already done in this repo):

- `k8s/deployment.yaml` uses `image: node-server:local` and `imagePullPolicy: Never`.
- The deployment now sets a `CUSTOM_MESSAGE` environment variable, which will be printed by the server.

### Apply the Namespace First:

```
kubectl apply -f k8s/namespace.yaml
```

### Then Apply the Manifests:

```
kubectl apply -f k8s/ -n kube-learn
```

## 6. Check Pod Status

```
kubectl get pods -n kube-learn -l app=node-server
```

## 7. Access the Service

The service is exposed on NodePort `30007`.

Open in your browser:

```
http://localhost:30007
```

You should see:

```
Hello from Node.js on Kubernetes! This is a custom message from the environment!
```

---

## Deploy with Helm (Optional)

1. Edit `helm/node-server/values.yaml` to customize image/tag/ports or the `CUSTOM_MESSAGE` env variable:
   ```yaml
   env:
     PORT: 3000
     CUSTOM_MESSAGE: Your custom message here!
   ```
2. Install the chart:
   ```
   helm install node-server ./helm/node-server
   ```
3. Uninstall:
   ```
   helm uninstall node-server
   ```

---

## Clean Up

To remove the deployment and service:

```
kubectl delete -f k8s/
```

---

## Notes

- If you change the server code, rebuild and re-tag the Docker image, then re-apply the deployment.
- For production, push your image to a registry and update the deployment accordingly.
- The server prints the value of the `CUSTOM_MESSAGE` environment variable along with the hello message.
