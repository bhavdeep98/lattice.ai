import { Environment } from '../../core/types';

/**
 * Configuration for a Lattice Queue
 * AI-friendly intent for async processing.
 */
export interface LatticeQueueProps {
    /**
     * Logical name of the queue.
     * @example "order-processing"
     */
    name: string;

    /**
     * Deployment environment.
     */
    environment: Environment;

    /**
     * Type of queue:
     * - 'standard': Best effort ordering, high throughput.
     * - 'fifo': First-In-First-Out, guaranteed ordering, lower throughput.
     * @default 'standard'
     */
    type?: 'standard' | 'fifo';

    /**
     * Enable Dead Letter Queue (DLQ) for failed messages?
     * Highly recommended for reliability.
     * @default true
     */
    dlq?: boolean;

    /**
     * How long a message is invisible after being read (in seconds).
     * Should be longer than your consumer's timeout.
     * @default 30
     */
    visibilityTimeout?: number;
}

export interface LatticeQueueConstruct {
    output: {
        queueUrl: string;
        queueArn: string;
        dlqArn?: string;
    };
}
