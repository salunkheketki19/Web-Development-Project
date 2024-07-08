const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
// const { nanoid } = require("nanoid");
const crypto = require("crypto");

const s3 = new S3Client();
const dynamoDB = new DynamoDBClient();

exports.handler = async (event) => {
  try {
      const body = JSON.parse(event.body);
    const inputText = body.inputText;
    const inputFile = body.inputFile; // Assuming file content is base64 encoded

    const id = crypto.randomUUID();
    const bucketName = process.env.BUCKET_NAME;
    const filePath = `${id}.txt`;

    // Save file to S3
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      Body: Buffer.from(inputFile),
    }));

    // Save entry to DynamoDB
    await dynamoDB.send(new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        id: { S: id },
        inputText: { S: inputText },
        inputFile: { S: filePath },
      },
    }));

    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Allow from all origins
        'Vary': 'Origin',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,Access-Control-Allow-Origin,Access-Control-Allow-Methods',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
      },
      body: JSON.stringify({ message: 'File uploaded successfully', id }),
    };

    return response;
  } catch (error) {
    console.error(error);
    const response = {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to upload file. Event:' + event.body + event.inputFile, error: error.message }),
    };
    return response;
  }
};
