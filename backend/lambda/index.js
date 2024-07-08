const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");

const { nanoid } = require("nanoid");

const s3 = new S3Client();
const dynamoDB = new DynamoDBClient();

exports.handler = async (event) => {
  try {
    // Get the event body
    const body = JSON.parse(event.body);
    const inputText = body.inputText;
    const inputFile = body.inputFile;

    const id = nanoid();
    const bucketName = process.env.BUCKET_NAME;
    const tableName = process.env.TABLE_NAME;
    const filePath = `${id}.input`;

    // Upload file to S3
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      Body: Buffer.from(inputFile, 'base64'),
    }));

    // Insert a record in DynamoDB
    await dynamoDB.send(new PutItemCommand({
      TableName: tableName,
      Item: {
        id: { S: id },
        input_text: { S: inputText },
        input_file_path: { S: filePath },
      },
    }));

    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
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
      body: JSON.stringify({ message: 'Failed to upload file.', error: error.message }),
    };

    return response;
  }
};
