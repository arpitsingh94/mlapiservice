# ML API Service

This project is an API service for a creating, training and testing ML models.

## Installation

Just clone this project, cd into **models** and run the following to start the server:

```bash
npm install && npm start
```
A pm2 configuration file is provided in case process management is required.

## Features

The API service allows the following:

1. Create a model by providing model name and description. This returns a unique modelId.

2. Fetch existing models by modelId.

3. Upload training images for a particular model.

4. Run an experiment on a model with parameters of learning rate, num of layers and num of steps. *train.py* can be updated to change the training algorithm.

5. Test models with a test image. Retrieves the set of parameters that gave highest accuracy during experiments and uses them to run the test.


**scripts** contains currently a single script to execute all of the above in order.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
