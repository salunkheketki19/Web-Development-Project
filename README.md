

What does this project do?

This project uploads a user-provided file to AWS S3 and DynamoDB using AWS Lambda. When a file is inserted into DynamoDB, this event triggers another Lambda function. This secondary function creates a modified copy of the file, uploads the new version to S3, and updates the corresponding DynamoDB record with details of the modifications.

## How to Run

### Step 1: Deploy the Stack
```
cd backend
cdk deploy
```

### Step 2: Navigate to the React App

Once the stack is deployed, navigate to the frontend directory:
    ```
    cd ../frontend
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
