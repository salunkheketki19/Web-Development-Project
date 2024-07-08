#!/bin/bash
ID=$1
TABLE_NAME=$2
BUCKET_NAME=$3

# Get input from DynamoDB
INPUT_TEXT=$(aws dynamodb get-item --table-name $TABLE_NAME --key '{"id":{"S":"'$ID'"}}' --query 'Item.input_text.S' --output text --region us-east-2)
INPUT_FILE_PATH=$(aws dynamodb get-item --table-name $TABLE_NAME --key '{"id":{"S":"'$ID'"}}' --query 'Item.input_file_path.S' --output text --region us-east-2)

# Download input file
aws s3 cp s3://$BUCKET_NAME/$INPUT_FILE_PATH input_file

# Process file
TEXT_LENGTH=${#INPUT_TEXT}
echo "$(<input_file) : $INPUT_TEXT" > output_file

# Upload output file
OUTPUT_FILE_PATH="${ID}_${TEXT_LENGTH}.output"
aws s3 cp output_file s3://$BUCKET_NAME/$OUTPUT_FILE_PATH

# Update DynamoDB
aws dynamodb update-item --table-name $TABLE_NAME --key '{"id":{"S":"'$ID'"}}' --update-expression "SET output_file_path = :p" --expression-attribute-values '{":p":{"S":"'$OUTPUT_FILE_PATH'"}}' --region us-east-2