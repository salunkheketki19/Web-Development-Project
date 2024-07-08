# Fovus Project

This repository contains two main components: an AWS CDK stack (`fovus-project`) and a React application (`fovus-react-app`). Follow the instructions below to deploy the stack and run the web application.

## How to Run

### Step 1: Deploy the Stack

1. Navigate to the `fovus-project` directory:
    ```sh
    cd fovus-project
    ```

2. Deploy the stack using AWS CDK:
    ```sh
    cdk deploy
    ```

### Step 2: Navigate to the React App

Once the stack is deployed, navigate to the `fovus-react-app` directory:
    ```sh
    cd ../fovus-react-app
    ```

### Step 3: Install Node Modules

Install the necessary node modules:
    ```sh
    npm install
    ```

### Step 4: Run the Web App

Start the React application:
    ```sh
    npm start
    ```

Your web application should now be running locally and connected to the deployed AWS infrastructure.
