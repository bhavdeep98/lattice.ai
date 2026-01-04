import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { LatticeNetworkProps, LatticeNetworkConstruct } from './types';
import { NetworkOutput } from '../../core/types';

/**
 * LatticeNetwork - Multi-AZ VPC abstraction with security best practices
 */
export class LatticeNetwork extends Construct implements LatticeNetworkConstruct {
  public readonly output: NetworkOutput;
  private readonly vpc: ec2.Vpc;
  private readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: LatticeNetworkProps) {
    super(scope, id);

    const {
      cidr,
      highAvailability = true,
      enhancedSecurity = true,
      publicSubnets = 2,
      privateSubnets = 2,
      enableNatGateway = true,
      enableVpcFlowLogs = true,
    } = props;

    // Create VPC with best practices
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr(cidr),
      maxAzs: highAvailability ? 3 : 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: enableNatGateway ? (highAvailability ? 2 : 1) : 0,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create default security group with enhanced security
    this.securityGroup = new ec2.SecurityGroup(this, 'DefaultSecurityGroup', {
      vpc: this.vpc,
      description: 'Default security group for Lattice resources',
      allowAllOutbound: !enhancedSecurity, // Restrict outbound in enhanced mode
    });

    if (enhancedSecurity) {
      // Add specific outbound rules for enhanced security
      this.securityGroup.addEgressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(443),
        'HTTPS outbound'
      );
      this.securityGroup.addEgressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(80),
        'HTTP outbound'
      );
    }

    // Enable VPC Flow Logs if requested
    if (enableVpcFlowLogs) {
      const logGroup = new logs.LogGroup(this, 'VpcFlowLogsGroup', {
        retention: logs.RetentionDays.ONE_WEEK,
      });

      const flowLogRole = new iam.Role(this, 'VpcFlowLogRole', {
        assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
        inlinePolicies: {
          flowLogDeliveryRolePolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'logs:DescribeLogGroups',
                  'logs:DescribeLogStreams',
                ],
                resources: ['*'],
              }),
            ],
          }),
        },
      });

      new ec2.FlowLog(this, 'VpcFlowLog', {
        resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
        destination: ec2.FlowLogDestination.toCloudWatchLogs(logGroup, flowLogRole),
      });
    }

    // Set output
    this.output = {
      vpcId: this.vpc.vpcId,
      publicSubnetIds: this.vpc.publicSubnets.map(subnet => subnet.subnetId),
      privateSubnetIds: this.vpc.privateSubnets.map(subnet => subnet.subnetId),
      securityGroupId: this.securityGroup.securityGroupId,
    };
  }

  /**
   * Get the VPC construct for advanced use cases
   */
  public getVpc(): ec2.Vpc {
    return this.vpc;
  }

  /**
   * Get the default security group
   */
  public getSecurityGroup(): ec2.SecurityGroup {
    return this.securityGroup;
  }

  /**
   * Add a security group rule
   */
  public addSecurityGroupRule(
    peer: ec2.IPeer,
    port: ec2.Port,
    description?: string
  ): void {
    this.securityGroup.addIngressRule(peer, port, description);
  }
}