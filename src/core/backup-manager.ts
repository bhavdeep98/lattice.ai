import { Construct } from 'constructs';
import { Duration, Stack } from 'aws-cdk-lib';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as sns from 'aws-cdk-lib/aws-sns';
import { StatefulnessPolicy } from './statefulness';

export interface BackupConfig {
  policy: StatefulnessPolicy;
  backupVaultName?: string;
  enableCrossRegionBackup?: boolean;
  destinationRegion?: string;
  notificationTopic?: sns.ITopic;
  enableComplianceReporting?: boolean;
}

/**
 * Centralized backup management for Lattice resources
 * Implements AWS Backup best practices with compliance reporting
 */
export class LatticeBackupManager extends Construct {
  public readonly backupVault: backup.BackupVault;
  public readonly backupPlan: backup.BackupPlan;
  private readonly policy: StatefulnessPolicy;

  constructor(scope: Construct, id: string, config: BackupConfig) {
    super(scope, id);

    this.policy = config.policy;

    // Only create backup infrastructure if backups are enabled
    if (!this.policy.shouldEnableBackups()) {
      return;
    }

    // Create backup vault with encryption
    this.backupVault = new backup.BackupVault(this, 'BackupVault', {
      backupVaultName: config.backupVaultName || `lattice-backup-vault-${this.policy['config'].environment}`,
      encryptionKey: undefined, // Use default AWS managed key
      accessPolicy: this.createBackupVaultAccessPolicy(),
      notificationTopic: config.notificationTopic,
      notificationEvents: [
        backup.BackupVaultEvents.BACKUP_JOB_STARTED,
        backup.BackupVaultEvents.BACKUP_JOB_COMPLETED,
        backup.BackupVaultEvents.BACKUP_JOB_FAILED,
        backup.BackupVaultEvents.RESTORE_JOB_STARTED,
        backup.BackupVaultEvents.RESTORE_JOB_COMPLETED,
        backup.BackupVaultEvents.RESTORE_JOB_FAILED,
      ],
    });

    // Create backup plan with multiple rules
    this.backupPlan = new backup.BackupPlan(this, 'BackupPlan', {
      backupPlanName: `lattice-backup-plan-${this.policy['config'].environment}`,
      backupVault: this.backupVault,
      backupPlanRules: this.createBackupRules(config),
    });

    // Add compliance reporting if enabled
    if (config.enableComplianceReporting) {
      this.enableComplianceReporting();
    }
  }

  private createBackupVaultAccessPolicy(): iam.PolicyDocument {
    return new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          sid: 'DenyDeleteBackupVault',
          effect: iam.Effect.DENY,
          principals: [new iam.AnyPrincipal()],
          actions: [
            'backup:DeleteBackupVault',
            'backup:DeleteBackupVaultAccessPolicy',
            'backup:DeleteRecoveryPoint',
          ],
          resources: ['*'],
          conditions: {
            StringNotEquals: {
              'aws:PrincipalServiceName': [
                'backup.amazonaws.com',
              ],
            },
          },
        }),
      ],
    });
  }

  private createBackupRules(config: BackupConfig): backup.BackupPlanRule[] {
    const rules: backup.BackupPlanRule[] = [];

    // Daily backup rule
    const retentionDays = this.policy.getBackupRetentionDays();
    const enableContinuous = this.policy.shouldEnablePointInTimeRecovery();
    
    rules.push(new backup.BackupPlanRule({
      ruleName: 'DailyBackups',
      backupVault: this.backupVault,
      scheduleExpression: events.Schedule.cron({
        hour: '2', // 2 AM UTC
        minute: '0',
      }),
      // Continuous backup has a 35-day limit, use separate rule for longer retention
      deleteAfter: enableContinuous 
        ? Duration.days(Math.min(retentionDays, 35))
        : Duration.days(retentionDays),
      // Only add cold storage transition if continuous backup is disabled
      moveToColdStorageAfter: enableContinuous 
        ? undefined 
        : (this.policy['config'].environment === 'prod' ? Duration.days(30) : undefined),
      enableContinuousBackup: enableContinuous,
    }));

    // Weekly backup rule for longer retention (prod only)
    if (this.policy['config'].environment === 'prod') {
      rules.push(new backup.BackupPlanRule({
        ruleName: 'WeeklyBackups',
        backupVault: this.backupVault,
        scheduleExpression: events.Schedule.cron({
          weekDay: 'SUN',
          hour: '3',
          minute: '0',
        }),
        deleteAfter: Duration.days(365), // Keep weekly backups for 1 year
        moveToColdStorageAfter: Duration.days(90),
      }));

      // Monthly backup rule for compliance (prod only)
      rules.push(new backup.BackupPlanRule({
        ruleName: 'MonthlyBackups',
        backupVault: this.backupVault,
        scheduleExpression: events.Schedule.cron({
          day: '1',
          hour: '4',
          minute: '0',
        }),
        deleteAfter: Duration.days(2555), // Keep monthly backups for 7 years
        moveToColdStorageAfter: Duration.days(90),
      }));
    }

    // Cross-region backup rule (prod only)
    if (config.enableCrossRegionBackup && config.destinationRegion) {
      rules.push(new backup.BackupPlanRule({
        ruleName: 'CrossRegionBackups',
        backupVault: this.backupVault,
        scheduleExpression: events.Schedule.cron({
          hour: '5',
          minute: '0',
        }),
        deleteAfter: Duration.days(this.policy.getBackupRetentionDays()),
        copyActions: [{
          destinationBackupVault: backup.BackupVault.fromBackupVaultName(
            this,
            'CrossRegionVault',
            `lattice-backup-vault-${this.policy['config'].environment}-${config.destinationRegion}`
          ),
          deleteAfter: Duration.days(this.policy.getBackupRetentionDays()),
          moveToColdStorageAfter: Duration.days(30),
        }],
      }));
    }

    return rules;
  }

  private enableComplianceReporting(): void {
    // Create backup reporting plan for compliance
    new backup.CfnReportPlan(this, 'ComplianceReportPlan', {
      reportPlanName: `lattice-compliance-report-${this.policy['config'].environment}`,
      reportDeliveryChannel: {
        s3BucketName: `lattice-backup-reports-${Stack.of(this).account}-${Stack.of(this).region}`,
        s3KeyPrefix: `compliance-reports/${this.policy['config'].environment}/`,
        formats: ['CSV', 'JSON'],
      },
      reportSetting: {
        reportTemplate: 'BACKUP_JOB_REPORT',
        accounts: [Stack.of(this).account],
        regions: [Stack.of(this).region],
      },
    });
  }

  /**
   * Add a resource to the backup plan
   */
  public addResource(resourceArn: string, resourceType: string): void {
    if (!this.policy.shouldEnableBackups()) {
      return; // Skip if backups are disabled
    }

    // Create backup selection for the resource
    new backup.BackupSelection(this, `BackupSelection-${resourceType}`, {
      backupPlan: this.backupPlan,
      resources: [backup.BackupResource.fromArn(resourceArn)],
      allowRestores: true,
      backupSelectionName: `${resourceType}-selection`,
    });
  }

  /**
   * Add multiple resources with tag-based selection
   */
  public addResourcesByTag(tagKey: string, tagValue: string): void {
    if (!this.policy.shouldEnableBackups()) {
      return;
    }

    new backup.BackupSelection(this, `BackupSelectionByTag-${tagKey}-${tagValue}`, {
      backupPlan: this.backupPlan,
      resources: [
        backup.BackupResource.fromTag(tagKey, tagValue),
      ],
      allowRestores: true,
      backupSelectionName: `tag-based-selection-${tagKey}-${tagValue}`,
    });
  }

  /**
   * Get backup vault ARN for cross-construct reference
   */
  public getBackupVaultArn(): string | undefined {
    return this.backupVault?.backupVaultArn;
  }
}