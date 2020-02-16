import requests
import sys
import json
from time import sleep

baseurl = "http://localhost:3000"

#create model
createModelPath = "/model"
print("Creating Model....")
payload = "{\"name\" : \"firstModel\",\"description\": \"basic model that trains on sets of images and generates random accuracy.\",\"train\": \"pytrain\",\"test\":\"pytest\"\n}"
headers = {
  'Content-Type': 'application/json'
}
response = requests.request("POST", baseurl+createModelPath, headers=headers, data = payload)
print(response.text.encode('utf8'))
if(response.status_code > 299):
    print("Exiting due to error")
    sys.exit()
modelId = json.loads(response.text.encode('utf8'))['modelId']

#upload training images
uploadTrainPath = "/model/upload"

payload = {'modelId': modelId}
files = [
  ('images', open('train/0266554465.jpeg','rb')),
  ('images', open('train/8283897908.jpeg','rb')),
  ('images', open('train/BLG_Andrew-G_-River-Sample_09_13_12.webp','rb')),
  ('images', open('train/GettyImages-78cae816a1d3e.jpg','rb')),
  ('images', open('train/notredame.jpg','rb')),
  ('images', open('train/x1d-ii-xcd45p-02.jpg','rb'))
]

response = requests.request("PUT", baseurl+uploadTrainPath, data = payload, files = files)
print(response.text.encode('utf8'))
if(response.status_code > 299):
    print("Exiting due to error")
    sys.exit()

#run experiments
experimentPath = "/model/experiment"
learning_rates = [0.001,0.01,0.1]
num_layers = [1,2,4]
num_steps = [1000,2000,4000]

for i in learning_rates:
    for j in num_layers:
        for k in num_steps:
            print("running experiment with args: i="+str(i)+", j="+str(j)+", k="+str(k))
            payloaddict = {
                "modelId": modelId,
                "params": {
                    "i" : i,
                    "j" : j,
                    "k" : k
                }
            }
            payload = json.dumps(payloaddict)
            headers = {
            'Content-Type': 'application/json'
            }
            response = requests.request("PUT", baseurl+experimentPath, headers=headers, data = payload)
            print(response.text.encode('utf8'))
            if(response.status_code > 299):
                print("Exiting due to error")
                sys.exit()
            sleep(1)

#wait a little before testing
print("wait for experiments to finish")
sleep(30)
#fetching the model once

fetchurl = baseurl+"/model?modelId="+modelId
response = requests.request("GET", fetchurl)

print("These are the experiments run till now with their accuracies: ")
results = json.loads(response.text.encode('utf8'))
for exp in results['experiments']:
    print("For  i={}, j={}, k={}, accuracy ={}".format(exp["params"]["i"], exp["params"]["j"],exp["params"]["k"], exp["accuracy"]))


#test model
testUrl = "/model/test"
payload = {'modelId': modelId}
files = [
  ('image', open('test/photo-150813822167.jpg','rb'))
]

response = requests.request("PUT", baseurl+testUrl, data = payload, files = files)
print("Test result: "+response.text.encode('utf8'))