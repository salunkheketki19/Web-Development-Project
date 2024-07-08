# Fovus Project

This repository contains two main components: an AWS CDK stack (`fovus-project`) and a React application (`fovus-react-app`). Follow the instructions below to deploy the stack and run the web application.

## How to Run

### Step 1: Deploy the Stack

1. Navigate to the `fovus-project` directory:
    ```
    cd fovus-project
    ```

2. Deploy the stack using AWS CDK:
    ```
    cdk deploy
    ```

### Step 2: Navigate to the React App

Once the stack is deployed, navigate to the `fovus-react-app` directory:
    ```
    cd ../fovus-react-app
    ```

### Step 3: Install Node Modules

Install the necessary node modules:
    ```
    npm install
    ```

### Step 4: Run the Web App

Start the React application:
    ```
    npm start
    ```

Your web application should now be running locally and connected to the deployed AWS infrastructure.


### References
- [AWS CDK](https://docs.aws.amazon.com/cdk/api/v2/)
- [AWS SDKv3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
