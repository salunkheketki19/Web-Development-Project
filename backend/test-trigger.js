const { EC2Client, StartInstancesCommand, StopInstancesCommand, DescribeInstancesCommand } = require("@aws-sdk/client-ec2");
const { SSMClient, SendCommandCommand } = require("@aws-sdk/client-ssm");

const ec2 = new EC2Client();
const ssm = new SSMClient();

exports.handler = async (event) => {
  const instanceId = process.env.INSTANCE_ID;

  try {
    // Start the EC2 instance
    await ec2.send(new StartInstancesCommand({ InstanceIds: [instanceId] }));

    // Wait for the instance to be running
    let instanceRunning = false;
    while (!instanceRunning) {
      const { Reservations } = await ec2.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
      const instance = Reservations[0].Instances[0];
      if (instance.State.Name === 'running') {
        instanceRunning = true;
      } else {
        await new Promise(resolve => setTimeout(resolve, 5000)); // wait for 5 seconds
      }
    }

    // Send a command to the instance to execute the script
    const scriptCommand = `aws s3 cp s3://MyBucket/script.sh . && chmod +x script.sh && ./script.sh`;

    await ssm.send(new SendCommandCommand({
      InstanceIds: [instanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: { commands: [scriptCommand] }
    }));

    // Stop the EC2 instance after the script execution
    await ec2.send(new StopInstancesCommand({ InstanceIds: [instanceId] }));
  } catch (error) {
    console.error(error);
    throw error;
  }
};
