import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { LatticeIdentityProps, LatticeIdentityConstruct, IdentityRole } from './types';
import { IdentityOutput } from '../../core/types';

/**
 * LatticeIdentity - IAM role abstraction with least-privilege access patterns
 */
export class LatticeIdentity extends Construct implements LatticeIdentityConstruct {
  public readonly output: IdentityOutput;
  
  // Escape hatch: Direct access to underlying AWS CDK construct
  public readonly instance: iam.Role;
  
  private readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: LatticeIdentityProps) {
    super(scope, id);

    const {
      name,
      environment,
      role: roleType,
      programmaticAccess = false,
      policies = [],
      customPolicyStatements = [],
      trustedServices = [],
      externalId,
    } = props;

    // Determine trusted principals based on role type and configuration
    const trustedPrincipals = this.getTrustedPrincipals(roleType, trustedServices, programmaticAccess);

    // Create IAM role
    this.role = new iam.Role(this, 'Role', {
      roleName: `${name}-${environment}-role`,
      assumedBy: trustedPrincipals,
      externalIds: externalId ? [externalId] : undefined,
      description: `Lattice ${roleType} role for ${name} in ${environment}`,
    });

    // Apply role-based policies
    this.applyRoleBasedPolicies(roleType);

    // Apply additional managed policies
    policies.forEach(policyArn => {
      this.role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName(policyArn));
    });

    // Apply custom policy statements
    if (customPolicyStatements.length > 0) {
      const customPolicy = new iam.Policy(this, 'CustomPolicy', {
        statements: customPolicyStatements.map(stmt => iam.PolicyStatement.fromJson(stmt)),
      });
      this.role.attachInlinePolicy(customPolicy);
    }

    // Expose underlying construct for escape hatch scenarios
    this.instance = this.role;

    // Set output
    this.output = {
      roleArn: this.role.roleArn,
      roleName: this.role.roleName,
    };
  }

  private getTrustedPrincipals(
    roleType: IdentityRole,
    trustedServices: string[],
    programmaticAccess: boolean
  ): iam.IPrincipal {
    const principals: iam.IPrincipal[] = [];

    // Add service principals based on role type
    switch (roleType) {
      case 'application':
        principals.push(
          new iam.ServicePrincipal('ec2.amazonaws.com'),
          new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
          new iam.ServicePrincipal('lambda.amazonaws.com')
        );
        break;
      case 'service':
        principals.push(new iam.ServicePrincipal('lambda.amazonaws.com'));
        break;
      case 'admin':
      case 'readonly':
        if (programmaticAccess) {
          // For admin/readonly roles, typically assumed by users or other roles
          // This would need to be configured based on your account structure
        }
        break;
    }

    // Add additional trusted services
    trustedServices.forEach(service => {
      principals.push(new iam.ServicePrincipal(service));
    });

    return principals.length === 1 ? principals[0] : new iam.CompositePrincipal(...principals);
  }

  private applyRoleBasedPolicies(roleType: IdentityRole): void {
    switch (roleType) {
      case 'application':
        // Basic application permissions
        this.role.addToPolicy(new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          resources: ['*'],
        }));
        break;

      case 'service':
        // Service-specific permissions
        this.role.addToPolicy(new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'xray:PutTraceSegments',
            'xray:PutTelemetryRecords',
          ],
          resources: ['*'],
        }));
        break;

      case 'readonly':
        // Read-only access patterns
        this.role.addManagedPolicy(
          iam.ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess')
        );
        break;

      case 'admin':
        // Administrative access (use with caution)
        this.role.addManagedPolicy(
          iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess')
        );
        break;
    }
  }

  /**
   * Get the IAM role construct for advanced use cases
   */
  public getRole(): iam.Role {
    return this.role;
  }

  /**
   * Add a policy statement to the role
   */
  public addPolicyStatement(statement: iam.PolicyStatement): void {
    this.role.addToPolicy(statement);
  }

  /**
   * Grant permissions to access a specific resource
   */
  public grantResourceAccess(resource: any, actions: string[]): void {
    this.role.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions,
      resources: [resource],
    }));
  }
}