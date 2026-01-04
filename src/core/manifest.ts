/**
 * Lattice Manifest - The "AI Contract"
 * 
 * This file defines the schema that AI Agents should target when generating
 * infrastructure for Lattice-2.0. It is designed to be:
 * 1. Holistic: Describes the entire application in one object.
 * 2. Intent-Based: Focuses on "what" not "how".
 * 3. Self-Documenting: Props are heavily commented to serve as Prompt Context.
 */

import { Environment } from './types';
import { LatticeComputeProps } from '../modules/compute/types';
import { LatticeDatabaseProps } from '../modules/database/types';
import { LatticeBucketProps } from '../modules/storage/types';
import { LatticeWebsiteProps } from '../modules/website/types';
import { LatticeQueueProps } from '../modules/queue/types';
// Note: LatticeWebsiteProps and LatticeQueueProps will be imported once created.
// For now we will define placeholders or use 'any' if modules aren't ready, 
// but to keep it clean we'll define the interfaces here if they are simple, 
// or assume they will be available. 
// Actually, better to define the Manifest AFTER the modules are created so import works.
// However, the plan says 'Define Intent Schema' first.
// I'll define the high-level manifest and use `any` for the new modules temporarily 
// until I create them in the next steps, OR I can define the types in their respective definition files FIRST.
// Let's stick to the plan: Create Manifest, but I need the types.
// I will create the types in this file if they don't exist, or just referencing them.
// A better approach: Create the module files first (empty or just types), THEN the manifest.
// But the prompt expectation is Manifest first.
// I will define the types inside their (future) module paths first? No, that's too much context switching.
// I will define the `LatticeManifest` and assume types are/will be available.
// To avoid compilation errors, I will use `any` for the new modules and TODO comment to replace them.

// Wait, I can just create the new module type files now.
// Let's create the module type files first, then the manifest. 
// That seems more robust.

// Re-evaluating: I will create `src/modules/website/types.ts` and `src/modules/queue/types.ts` first.
// Then `src/core/manifest.ts`.

export interface LatticeManifest {
    /**
     * The human-readable name of the application.
     * @example "my-startup-mvp"
     */
    appName: string;

    /**
     * The target deployment environment.
     * - 'dev': Low cost, fast deploys, destroy on delete.
     * - 'prod': High availability, backups, retention policies.
     */
    environment: Environment;

    /**
     * The capabilities (resources) required by the application.
     * The AI should only populate the keys for resources strictly needed by the user.
     */
    capabilities: {
        /**
         * Frontend application hosting (S3 + CloudFront).
         * Use this for React, Vue, or static site deployments.
         */
        website?: LatticeWebsiteProps;

        /**
         * Backend compute resources (Lambda, ECS, or EC2).
         * Use this for APIs, background workers, or app servers.
         */
        api?: Omit<LatticeComputeProps, 'network'>;

        /**
         * persistent data storage (SQL Database).
         * Use this for structured user data, transactions, etc.
         */
        database?: Omit<LatticeDatabaseProps, 'network'>;

        /**
         * Message queue for async processing (SQS).
         * Use this to decouple components or handle load spikes.
         */
        queue?: LatticeQueueProps;

        /**
         * Object storage buckets (S3).
         * Use this for user uploads, documents, or raw data assets.
         */
        storage?: LatticeBucketProps;
    };

    /**
     * Threat modeling configuration.
     * If enabled, Lattice will generate a threat model report during synthesis.
     */
    threatModel?: {
        /**
         * Enable automated threat modeling?
         * @default true
         */
        enabled: boolean;

        /**
         * Project name for the threat model report.
         * Defaults to appName.
         */
        projectName?: string;
    };
}
