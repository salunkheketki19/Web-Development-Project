import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';

export class FovusProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create S3 Bucket
    const fileBucket = new s3.Bucket(this, 'FovusBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: false,
    });

    // Create DynamoDB Table
    const fileTable = new dynamodb.Table(this, 'FovusTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_IMAGE,  // Enable stream on the fileTable
    });

    // Create EC2 Instance SSM Role
    const ec2SsmRole = new iam.Role(this, 'EC2SSMRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for EC2 instances with SSM access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMFullAccess')
      ]
    });

    // Create Instance profile for the SSM role
    const instanceProfile = new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      role: ec2SsmRole,
    });

    // Create lambda function for the API
    const fileUploadLambda = new lambda.Function(this, 'FileUploadLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.seconds(15),
      environment: {
        BUCKET_NAME: fileBucket.bucketName,
        TABLE_NAME: fileTable.tableName
      },
    });

    fileBucket.grantReadWrite(fileUploadLambda);
    fileTable.grantReadWriteData(fileUploadLambda);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'FileUploadAPI', {
      restApiName: 'File Upload Service',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    const integration = new apigateway.LambdaIntegration(fileUploadLambda);
    api.root.addMethod('POST', integration);

    fileBucket.grantReadWrite(ec2SsmRole);
    fileTable.grantReadWriteData(ec2SsmRole);

    // Create lambda function to trigger EC2
    const triggerEc2Lambda = new lambda.Function(this, 'TriggerEc2Lambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'trigger.handler',
      code: lambda.Code.fromAsset('lambda'),
      timeout: cdk.Duration.seconds(180),
      environment: {
        BUCKET_NAME: fileBucket.bucketName,
        TABLE_NAME: fileTable.tableName,
        INSTANCE_PROFILE_ARN: instanceProfile.instanceProfileArn
      },
    });

    fileBucket.grantReadWrite(triggerEc2Lambda);
    fileTable.grantReadWriteData(triggerEc2Lambda);

    triggerEc2Lambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ec2:RunInstances',
        'ec2:DescribeInstances',
        'ec2:TerminateInstances'
      ],
      resources: ['*']
    }));

    triggerEc2Lambda.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ssm:SendCommand', 'ssm:GetCommandInvocation'],
      resources: ['*'],
    }));

    triggerEc2Lambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      resources: [ec2SsmRole.roleArn],
    }));

    // Add DynamoDB as an event source
    triggerEc2Lambda.addEventSource(new lambdaEventSources.DynamoEventSource(fileTable, {
      startingPosition: lambda.StartingPosition.LATEST,
      batchSize: 1,
      retryAttempts: 0,
    }));
  }
}
