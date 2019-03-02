# Create cluster in GKE

* We will be using Google Kubernetes Engine (GKE) to host the infrastructure 
* Make sure you have authenticated to the google cloud using your `gcloud` sdk in your host operating system

## Export the variables

* Export the name of the cluster and project, this we will be using in future for the setup automation
* Make sure replace the `training-automation-stuff` with your google cloud project name

```bash
export STUDENTCLUSTERNAME='splat'
export STUDENTPROJECTNAME='training-automation-stuff'
export STUDENTREGION='us-central1'
```

## Cluster creation

* Create cluster using the below command

```bash
gcloud beta container --project "$STUDENTPROJECTNAME" clusters create "$STUDENTCLUSTERNAME" --zone "$STUDENTREGION-a" --no-enable-basic-auth --cluster-version "1.11.6-gke.2" --machine-type "n1-standard-1" --image-type "COS" --disk-type "pd-standard" --disk-size "50" --metadata disable-legacy-endpoints=true --scopes "https://www.googleapis.com/auth/devstorage.read_only","https://www.googleapis.com/auth/logging.write","https://www.googleapis.com/auth/monitoring","https://www.googleapis.com/auth/servicecontrol","https://www.googleapis.com/auth/service.management.readonly","https://www.googleapis.com/auth/trace.append" --preemptible --num-nodes "3" --enable-cloud-logging --enable-cloud-monitoring --no-enable-ip-alias --network "projects/$STUDENTPROJECTNAME/global/networks/default" --subnetwork "projects/$STUDENTPROJECTNAME/regions/$STUDENTREGION/subnetworks/default" --enable-autoscaling --min-nodes "2" --max-nodes "5" --addons HorizontalPodAutoscaling,HttpLoadBalancing --enable-autoupgrade --enable-autorepair --maintenance-window "21:30"
```

## Static IP for nginx-ingress

* Create the static IP for the cluster

```bash
gcloud compute addresses create $STUDENTCLUSTERNAME-sip --region $STUDENTREGION --project $STUDENTPROJECTNAME
export STUDENTCLUSTERSIP=$(gcloud compute addresses list --filter "name=$STUDENTCLUSTERNAME-sip" | grep $STUDENTCLUSTERNAME-sip | awk '{print $2}')
```


## Generating GKE cluster credentials for accessing

* Generate cluster credentials

```bash
gcloud container clusters get-credentials $STUDENTCLUSTERNAME --zone $STUDENTREGION-a --project $STUDENTPROJECTNAME
```
