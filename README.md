# kube-learn Node.js Server on Kubernetes

This project demonstrates a simple Node.js HTTP server deployed to Kubernetes using Docker Desktop on macOS, with Kafka integration for event publishing and consumption.

## Prerequisites

- Docker Desktop with Kubernetes enabled
- Node.js and npm
- kubectl
- (Optional) Helm
- (Optional) [Argo CD](https://argo-cd.readthedocs.io/en/stable/)

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
- The deployment sets environment variables for `CUSTOM_MESSAGE`, `KAFKA_BROKER`, and `KAFKA_TOPIC`.

### Apply the Namespace First:

```
kubectl apply -f k8s/namespace.yaml
```

### Deploy Kafka and Zookeeper:

```
kubectl apply -f k8s/kafka-deployment.yaml
```

### Then Apply the Node.js and Service Manifests:

```
kubectl apply -f k8s/deployment.yaml -n kube-learn
kubectl apply -f k8s/service.yaml -n kube-learn
```

## 6. Check Pod Status

```
kubectl get pods -n kube-learn
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

## Kafka Integration

This project includes a Kafka producer and consumer using [kafkajs](https://kafka.js.org/):

- **Producer:**
  - POST to `/publish` endpoint to publish an event to Kafka.
- **Consumer:**
  - Subscribes to the same topic and logs `YAY! EVENT CONSUMED!` when an event is received.

### /publish Endpoint

- **URL:** `POST /publish`
- **Description:** Publishes a sample event to Kafka.
- **Example with curl:**
  ```sh
  curl -X POST http://localhost:30007/publish
  ```
- **Expected Response:**
  ```json
  { "status": "Event published!" }
  ```
- **Expected Log Output (in pod logs):**
  ```
  YAY! EVENT CONSUMED!
  Consumed message: { ...event... }
  ```

---

## Deploy with Helm (Optional)

1. Edit `helm/node-server/values.yaml` to customize image/tag/ports or the `CUSTOM_MESSAGE` env variable:
   ```yaml
   env:
     PORT: 3000
     CUSTOM_MESSAGE: Your custom message here!
     KAFKA_BROKER: kafka:9092
     KAFKA_TOPIC: kube-learn-topic
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

## Deploy with Argo CD (GitOps)

Argo CD is a declarative, GitOps continuous delivery tool for Kubernetes. It keeps your cluster in sync with your GitHub repo.

### 1. Install Argo CD

Create the namespace and install Argo CD:

```sh
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### 2. Expose the Argo CD API Server (for local access)

```sh
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Access the UI at: [https://localhost:8080](https://localhost:8080)

### 3. Log in to Argo CD

- Username: `admin`
- Password:
  ```sh
  kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
  ```

### 4. Create an Argo CD Application

Create a manifest like `k8s/argo-cd/argocd-app.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: kube-learn
  namespace: argocd
spec:
  project: default
  source:
    repoURL: "https://github.com/<your-username>/kube-learn.git"
    targetRevision: HEAD
    path: k8s
  destination:
    server: "https://kubernetes.default.svc"
    namespace: kube-learn
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

- Replace `<your-username>` with your GitHub username.
- `path` should point to the directory with your Kubernetes manifests.

Apply the application manifest:

```sh
kubectl apply -f k8s/argo-cd/argocd-app.yaml
```

### 5. Watch Argo CD Sync Your App

- Open the Argo CD UI and watch your `kube-learn` application sync.
- Any changes you push to your repo will be automatically applied to your cluster.

### 6. (Optional) Use Helm with Argo CD

If you want to use the Helm chart instead of raw manifests, set `path: helm/node-server` in your Application manifest and add:

```yaml
helm:
  valueFiles:
    - values.yaml
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
- Argo CD keeps your cluster in sync with your GitHub repo for true GitOps workflow.
- Kafka is deployed for demo/dev purposes using Bitnami images. For production, use a managed Kafka or a more robust setup.
