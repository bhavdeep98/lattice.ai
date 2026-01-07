import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LatticeManifest } from './manifest';
import { applyLatticeAspects } from './aspects';
import { LatticeNetwork } from '../modules/network/lattice-network';
import { LatticeCompute } from '../modules/compute/lattice-compute';
import { LatticeDatabase } from '../modules/database/lattice-database';
import { LatticeBucket } from '../modules/storage/lattice-bucket';
import { LatticeWebsite } from '../modules/website/lattice-website';
import { LatticeQueue } from '../modules/queue/lattice-queue';
import { NetworkOutput, DatabaseOutput, ComputeOutput } from './types';
import { logger, withLogging } from '../utils/logger';

/**
 * LatticeStack - The AI-Driven Orchestrator
 * Consumes a LatticeManifest and builds the complete infrastructure.
 */
export class LatticeStack extends Stack {
    public readonly outputs: {
        network?: NetworkOutput;
        database?: DatabaseOutput;
        compute?: ComputeOutput;
    } = {};

    constructor(scope: Construct, id: string, manifest: LatticeManifest, props?: StackProps) {
        super(scope, id, props);

        const { appName, environment, capabilities, threatModel } = manifest;

        logger.start(`Deploying ${appName}`, 5);

        // 1. Apply Guardrails & Threat Modeling
        logger.step('Applying security aspects and guardrails');
        applyLatticeAspects(this, {
            environment,
            projectName: appName,
            owner: 'AI-Agent',
            threatModel: threatModel ? {
                enabled: threatModel.enabled,
                projectName: threatModel.projectName ?? appName,
            } : undefined
        });

        // 2. Foundation: Network
        let networkOutput: NetworkOutput | undefined;
        let networkInstance: LatticeNetwork | undefined;
        const needsNetwork = !!capabilities.api || !!capabilities.database;

        if (needsNetwork) {
            logger.step('Creating network infrastructure');
            networkInstance = new LatticeNetwork(this, 'Network', {
                name: `${appName}-net`,
                environment,
                cidr: '10.0.0.0/16',
            });
            networkOutput = networkInstance.output;
            this.outputs.network = networkOutput;
            logger.resource('VPC', networkOutput.vpcId);
        }

        // 3. Database
        let dbOutput: DatabaseOutput | undefined;
        if (capabilities.database && networkOutput && networkInstance) {
            logger.step('Creating database infrastructure');
            const db = new LatticeDatabase(this, 'Database', {
                ...capabilities.database,
                environment,
                network: {
                    vpcId: networkOutput.vpcId,
                    subnetIds: networkOutput.privateSubnetIds,
                    securityGroupIds: [networkOutput.securityGroupId],
                },
                vpc: networkInstance.getVpc(),
            });
            dbOutput = db.output;
            this.outputs.database = dbOutput;
            logger.resource('Database', dbOutput.endpoint);
        }

        // 4. API / Compute
        let computeOutput: ComputeOutput | undefined;
        if (capabilities.api && networkOutput && networkInstance) {
            logger.step('Creating compute infrastructure');
            // Inject dependency: DB connection string if available
            const envVars = capabilities.api.functionCode || capabilities.api.userData
                ? undefined // Don't overwrite if manual
                : {};

            if (dbOutput && envVars) {
                // This is a naive injection, in reality we'd pass Secret ARN
                // But for the 'Intent' model, we assume the code handles retrieving secrets
            }

            const compute = new LatticeCompute(this, 'Api', {
                ...capabilities.api,
                environment,
                network: {
                    vpcId: networkOutput.vpcId,
                    subnetIds: networkOutput.privateSubnetIds,
                    securityGroupIds: [networkOutput.securityGroupId],
                },
                vpc: networkInstance.getVpc(),
                // Identity (Roles) would be handled here or auto-created
            });
            computeOutput = compute.output;
            this.outputs.compute = computeOutput;
        }

        // 5. Website
        if (capabilities.website) {
            new LatticeWebsite(this, 'Website', {
                ...capabilities.website,
                environment,
            });
        }

        // 6. Queue
        if (capabilities.queue) {
            new LatticeQueue(this, 'Queue', {
                ...capabilities.queue,
                environment,
            });
        }

        // 7. Storage
        if (capabilities.storage) {
            new LatticeBucket(this, 'Storage', {
                ...capabilities.storage,
                environment,
            });
        }
    }
}
