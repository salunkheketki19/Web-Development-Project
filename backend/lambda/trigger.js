const { EC2Client, RunInstancesCommand, DescribeInstancesCommand, TerminateInstancesCommand } = require("@aws-sdk/client-ec2");
const { SSMClient, SendCommandCommand } = require("@aws-sdk/client-ssm");

const ec2 = new EC2Client();
const ssm = new SSMClient();
const amazonLinux2AmiId = 'ami-024ebc7de0fc64e44';

exports.handler = async (event) => {  
  try {
    const record = event.Records[0];
    // If the event is not of type INSERT then ignore it
    if (record.eventName !== 'INSERT') {
      return;
    }

    const newImage = record.dynamodb.NewImage;
    const id = newImage.id.S;

    const bucketName = process.env.BUCKET_NAME;
    const tableName = process.env.TABLE_NAME;
    const instanceProfileArn = process.env.INSTANCE_PROFILE_ARN;

    // Build the EC2 instance
    const runInstanceParams = {
        ImageId: amazonLinux2AmiId,
        InstanceType: 't2.micro',
        MinCount: 1,
        MaxCount: 1,
        IamInstanceProfile: {
            Arn: instanceProfileArn
        }
      };

    const instanceData = await ec2.send(new RunInstancesCommand(runInstanceParams));
    const instanceId = instanceData.Instances[0].InstanceId;

    // Wait for the instance to be running
    let instanceRunning = false;
    while (!instanceRunning) {
      const { Reservations } = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
      const instance = Reservations[0].Instances[0];
      if (instance.State.Name === 'running') {
        instanceRunning = true;
      } else {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    // // Wait for 30 seconds till the instance is ready to accept SSM commands
    await new Promise(resolve => setTimeout(resolve, 30000));
    
    // Send a command to the instance to execute the script
    const scriptCommand = `aws s3 cp s3://${bucketName}/script.sh . && chmod +x script.sh && ./script.sh ${id} ${tableName} ${bucketName} --region us-east-2`;

    const res = await ssm.send(new SendCommandCommand({
      InstanceIds: [instanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: { commands: [scriptCommand] }
    }));
    
    // Wait till script execution is complete
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Terminate the EC2 instance
    await ec2.send( new TerminateInstancesCommand({ InstanceIds: [instanceId] }));

  } catch (error) {
    console.error(error);
    throw error;
  }
};
