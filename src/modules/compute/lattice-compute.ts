import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import { LatticeComputeProps, LatticeComputeConstruct, ComputeType, ComputeSize } from './types';
import { ComputeOutput } from '../../core/types';

/**
 * LatticeCompute - Multi-type compute abstraction (EC2, ECS, Lambda)
 */
export class LatticeCompute extends Construct implements LatticeComputeConstruct {
  public readonly output: ComputeOutput;

  constructor(scope: Construct, id: string, props: LatticeComputeProps) {
    super(scope, id);

    const {
      name,
      environment,
      type,
      size,
      autoScaling = false,
      network,
      identity,
      userData,
      containerImage,
      functionCode,
      runtime = 'nodejs18.x',
      vpc,
    } = props;

    // Validate compute type
    const validTypes: ComputeType[] = ['vm', 'container', 'serverless'];
    if (!validTypes.includes(type)) {
      throw new Error(`Unsupported compute type: ${type}. Valid types: ${validTypes.join(', ')}`);
    }

    switch (type) {
      case 'vm':
        this.output = this.createVmCompute(name, environment, size, autoScaling, network, identity, userData, vpc);
        break;
      case 'container':
        this.output = this.createContainerCompute(name, environment, size, autoScaling, network, identity, containerImage, vpc);
        break;
      case 'serverless':
        this.output = this.createServerlessCompute(name, environment, size, network, identity, functionCode, runtime, vpc);
        break;
      default:
        throw new Error(`Unsupported compute type: ${type}`);
    }
  }

  private createVmCompute(
    name: string,
    environment: string,
    size: ComputeSize,
    autoScaling: boolean,
    network: any,
    identity?: any,
    userData?: string,
    existingVpc?: ec2.IVpc
  ): ComputeOutput {
    const vpc = existingVpc || ec2.Vpc.fromLookup(this, 'Vpc', {
      vpcId: network.vpcId,
    });

    const securityGroup = new ec2.SecurityGroup(this, 'VmSecurityGroup', {
      vpc,
      description: `Security group for ${name} VM instances`,
      allowAllOutbound: true,
    });

    // Allow SSH access (customize as needed)
    securityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(22),
      'SSH access from VPC'
    );

    const instanceType = this.getEc2InstanceType(size);
    const machineImage = ec2.MachineImage.latestAmazonLinux2();

    let role: iam.IRole | undefined;
    if (identity) {
      role = iam.Role.fromRoleArn(this, 'VmRole', identity.roleArn);
    }

    if (autoScaling) {
      const asg = new autoscaling.AutoScalingGroup(this, 'AutoScalingGroup', {
        vpc,
        instanceType,
        machineImage,
        securityGroup,
        role,
        userData: userData ? ec2.UserData.custom(userData) : undefined,
        minCapacity: 1,
        maxCapacity: 10,
        desiredCapacity: 2,
        vpcSubnets: {
          subnets: network.subnetIds.map((subnetId: string) =>
            ec2.Subnet.fromSubnetId(this, `Subnet-${subnetId}`, subnetId)
          ),
        },
      });

      return {
        instanceIds: [], // ASG manages instances dynamically
        clusterArn: asg.autoScalingGroupArn,
      };
    } else {
      const instance = new ec2.Instance(this, 'Instance', {
        vpc,
        instanceType,
        machineImage,
        securityGroup,
        role,
        userData: userData ? ec2.UserData.custom(userData) : undefined,
        vpcSubnets: {
          subnets: network.subnetIds.map((subnetId: string) =>
            ec2.Subnet.fromSubnetId(this, `Subnet-${subnetId}`, subnetId)
          ),
        },
      });

      return {
        instanceIds: [instance.instanceId],
      };
    }
  }

  private createContainerCompute(
    name: string,
    environment: string,
    size: ComputeSize,
    autoScaling: boolean,
    network: any,
    identity?: any,
    containerImage?: string,
    existingVpc?: ec2.IVpc
  ): ComputeOutput {
    const vpc = existingVpc || ec2.Vpc.fromLookup(this, 'Vpc', {
      vpcId: network.vpcId,
    });

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc,
      clusterName: `${name}-${environment}-cluster`,
    });

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      memoryLimitMiB: this.getContainerMemory(size),
      cpu: this.getContainerCpu(size),
      taskRole: identity ? iam.Role.fromRoleArn(this, 'TaskRole', identity.roleArn) : undefined,
    });

    const container = taskDefinition.addContainer('Container', {
      image: containerImage ?
        ecs.ContainerImage.fromRegistry(containerImage) :
        ecs.ContainerImage.fromRegistry('nginx:latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: `${name}-${environment}`,
      }),
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    const service = new ecs.FargateService(this, 'Service', {
      cluster,
      taskDefinition,
      desiredCount: autoScaling ? 2 : 1,
      vpcSubnets: {
        subnets: network.subnetIds.map((subnetId: string) =>
          ec2.Subnet.fromSubnetId(this, `Subnet-${subnetId}`, subnetId)
        ),
      },
    });

    if (autoScaling) {
      const scaling = service.autoScaleTaskCount({
        minCapacity: 1,
        maxCapacity: 10,
      });

      scaling.scaleOnCpuUtilization('CpuScaling', {
        targetUtilizationPercent: 70,
      });
    }

    return {
      clusterArn: cluster.clusterArn,
    };
  }

  private createServerlessCompute(
    name: string,
    environment: string,
    size: ComputeSize,
    network: any,
    identity?: any,
    functionCode?: string,
    runtime?: string,
    existingVpc?: ec2.IVpc
  ): ComputeOutput {
    const vpc = existingVpc || ec2.Vpc.fromLookup(this, 'Vpc', {
      vpcId: network.vpcId,
    });

    const lambdaFunction = new lambda.Function(this, 'Function', {
      functionName: `${name}-${environment}`,
      runtime: this.getLambdaRuntime(runtime || 'nodejs18.x'),
      handler: 'index.handler',
      code: functionCode ?
        lambda.Code.fromInline(functionCode) :
        lambda.Code.fromInline(`
          exports.handler = async (event) => {
            return {
              statusCode: 200,
              body: JSON.stringify('Hello from Lattice Lambda!'),
            };
          };
        `),
      timeout: Duration.seconds(30),
      memorySize: this.getLambdaMemory(size),
      role: identity ? iam.Role.fromRoleArn(this, 'LambdaRole', identity.roleArn) : undefined,
      vpc,
      vpcSubnets: {
        subnets: network.subnetIds.map((subnetId: string) =>
          ec2.Subnet.fromSubnetId(this, `Subnet-${subnetId}`, subnetId)
        ),
      },
    });

    return {
      functionArn: lambdaFunction.functionArn,
    };
  }

  private getEc2InstanceType(size: ComputeSize): ec2.InstanceType {
    const instanceTypes = {
      small: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      medium: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      large: ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE),
      xlarge: ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.XLARGE),
    };
    return instanceTypes[size];
  }

  private getContainerMemory(size: ComputeSize): number {
    const memoryLimits = {
      small: 512,
      medium: 1024,
      large: 2048,
      xlarge: 4096,
    };
    return memoryLimits[size];
  }

  private getContainerCpu(size: ComputeSize): number {
    const cpuLimits = {
      small: 256,
      medium: 512,
      large: 1024,
      xlarge: 2048,
    };
    return cpuLimits[size];
  }

  private getLambdaMemory(size: ComputeSize): number {
    const memoryLimits = {
      small: 128,
      medium: 256,
      large: 512,
      xlarge: 1024,
    };
    return memoryLimits[size];
  }

  private getLambdaRuntime(runtime: string): lambda.Runtime {
    const runtimes: Record<string, lambda.Runtime> = {
      'nodejs18.x': lambda.Runtime.NODEJS_18_X,
      'nodejs20.x': lambda.Runtime.NODEJS_20_X,
      'python3.9': lambda.Runtime.PYTHON_3_9,
      'python3.10': lambda.Runtime.PYTHON_3_10,
      'python3.11': lambda.Runtime.PYTHON_3_11,
      'java11': lambda.Runtime.JAVA_11,
      'java17': lambda.Runtime.JAVA_17,
      'dotnet6': lambda.Runtime.DOTNET_6,
    };
    return runtimes[runtime] || lambda.Runtime.NODEJS_18_X;
  }
}