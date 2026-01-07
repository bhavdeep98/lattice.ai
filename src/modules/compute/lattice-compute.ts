import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { LatticeComputeProps, LatticeComputeConstruct, ComputeType, ComputeSize } from './types';
import { ComputeOutput } from '../../core/types';
import { LatticeObservabilityManager } from '../../core/observability';
import { logger, logExecutionTime } from '../../utils/logger';

/**
 * LatticeCompute - Multi-type compute abstraction (EC2, ECS, Lambda)
 */
export class LatticeCompute extends Construct implements LatticeComputeConstruct {
  public readonly output: ComputeOutput;

  // Escape hatch: Direct access to underlying AWS CDK constructs
  // The actual type depends on the compute type (EC2, ECS, Lambda)
  public readonly instance:
    | ec2.Instance
    | autoscaling.AutoScalingGroup
    | ecs.FargateService
    | lambda.Function
    | undefined;

  // Observability: Alarms and dashboards for monitoring
  public readonly alarms: cloudwatch.Alarm[] = [];
  private readonly observabilityManager?: LatticeObservabilityManager;

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

    // Set logging context for compute operations
    logger.setContext({
      operation: 'compute-creation',
      resourceType: 'compute',
      resourceId: name,
      environment,
    });

    logger.info(`Creating Lattice compute resource: ${name}`, {
      type,
      size,
      autoScaling,
      runtime: type === 'serverless' ? runtime : undefined,
    });

    // Validate compute type
    const validTypes: ComputeType[] = ['vm', 'container', 'serverless'];
    if (!validTypes.includes(type)) {
      const error = new Error(
        `Unsupported compute type: ${type}. Valid types: ${validTypes.join(', ')}`
      );
      logger.error('Invalid compute type specified', error, { validTypes, providedType: type });
      throw error;
    }

    // Create observability manager if monitoring is enabled
    if (props.enableObservability !== false) {
      logger.info('Enabling compute observability');
      this.observabilityManager = LatticeObservabilityManager.create(this, 'Observability', {
        environment,
        enableAlarms: props.enableAlarms,
        enableDashboards: props.enableDashboards,
        notificationTopic: props.notificationTopic,
      });
    }

    switch (type) {
      case 'vm':
        logger.info('Creating VM compute instance', { size, autoScaling });
        const vmResult = this.createVmCompute(
          name,
          environment,
          size,
          autoScaling,
          network,
          identity,
          userData,
          vpc
        );
        this.output = vmResult.output;
        this.instance = vmResult.instance;
        break;
      case 'container':
        logger.info('Creating container compute service', { size, autoScaling, containerImage });
        const containerResult = this.createContainerCompute(
          name,
          environment,
          size,
          autoScaling,
          network,
          identity,
          containerImage,
          vpc
        );
        this.output = containerResult.output;
        this.instance = containerResult.instance;
        break;
      case 'serverless':
        logger.info('Creating serverless function', {
          size,
          runtime,
          functionCode: !!functionCode,
        });
        const serverlessResult = this.createServerlessCompute(
          name,
          environment,
          size,
          network,
          identity,
          functionCode,
          runtime,
          vpc
        );
        this.output = serverlessResult.output;
        this.instance = serverlessResult.instance;
        break;
      default:
        const error = new Error(`Unsupported compute type: ${type}`);
        logger.error('Unsupported compute type in switch statement', error, { type });
        throw error;
    }

    // Add observability after resource creation
    this.addObservability(type, name);

    const resourceId =
      this.output.instanceIds?.[0] ||
      this.output.clusterArn ||
      this.output.functionArn ||
      'unknown';
    logger.logResourceCreation('compute', resourceId, {
      type,
      size,
      autoScaling,
      runtime: type === 'serverless' ? runtime : undefined,
    });
  }

  /**
   * Add observability (alarms and dashboards) for the compute resource
   */
  private addObservability(type: ComputeType, resourceName: string): void {
    if (!this.observabilityManager || !this.instance) {
      return;
    }

    let staticResourceId: string;
    let actualResourceId: string;
    let resourceType: 'ec2' | 'ecs' | 'lambda';

    // Determine resource ID and type for monitoring
    if (type === 'vm') {
      if (this.instance instanceof ec2.Instance) {
        staticResourceId = `${resourceName}-instance`;
        actualResourceId = this.instance.instanceId;
        resourceType = 'ec2';
      } else if (this.instance instanceof autoscaling.AutoScalingGroup) {
        staticResourceId = `${resourceName}-asg`;
        actualResourceId = this.instance.autoScalingGroupName;
        resourceType = 'ec2'; // ASG uses EC2 metrics
      } else {
        return;
      }
    } else if (type === 'container' && this.instance instanceof ecs.FargateService) {
      staticResourceId = `${resourceName}-service`;
      actualResourceId = this.instance.serviceName;
      resourceType = 'ecs';
    } else if (type === 'serverless' && this.instance instanceof lambda.Function) {
      staticResourceId = `${resourceName}-function`;
      actualResourceId = this.instance.functionName;
      resourceType = 'lambda';
    } else {
      return;
    }

    // Create observability resources using static ID for alarm names
    const observability = this.observabilityManager.addComputeObservability(
      staticResourceId,
      resourceType,
      {
        resourceName,
        computeType: type,
        actualResourceId, // Pass actual resource ID for metrics
      }
    );

    // Store alarms for external access
    this.alarms.push(...observability.alarms);
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
  ): { output: ComputeOutput; instance: ec2.Instance | autoscaling.AutoScalingGroup } {
    const vpc =
      existingVpc ||
      ec2.Vpc.fromLookup(this, 'Vpc', {
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
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      });

      return {
        output: {
          instanceIds: [], // ASG manages instances dynamically
          clusterArn: asg.autoScalingGroupArn,
        },
        instance: asg,
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
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      });

      return {
        output: {
          instanceIds: [instance.instanceId],
        },
        instance: instance,
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
  ): { output: ComputeOutput; instance: ecs.FargateService } {
    const vpc =
      existingVpc ||
      ec2.Vpc.fromLookup(this, 'Vpc', {
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
      image: containerImage
        ? ecs.ContainerImage.fromRegistry(containerImage)
        : ecs.ContainerImage.fromRegistry('nginx:latest'),
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
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
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
      output: {
        clusterArn: cluster.clusterArn,
      },
      instance: service,
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
  ): { output: ComputeOutput; instance: lambda.Function } {
    const vpc =
      existingVpc ||
      ec2.Vpc.fromLookup(this, 'Vpc', {
        vpcId: network.vpcId,
      });

    const lambdaFunction = new lambda.Function(this, 'Function', {
      functionName: `${name}-${environment}`,
      runtime: this.getLambdaRuntime(runtime || 'nodejs18.x'),
      handler: 'index.handler',
      code: functionCode
        ? lambda.Code.fromInline(functionCode)
        : lambda.Code.fromInline(`
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
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    return {
      output: {
        functionArn: lambdaFunction.functionArn,
      },
      instance: lambdaFunction,
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
      java11: lambda.Runtime.JAVA_11,
      java17: lambda.Runtime.JAVA_17,
      dotnet6: lambda.Runtime.DOTNET_6,
    };
    return runtimes[runtime] || lambda.Runtime.NODEJS_18_X;
  }
}
