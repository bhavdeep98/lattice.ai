import { Environment } from '../../core/types';

/**
 * Configuration for a Lattice Website
 * Designed for AI generation from natural language intents.
 */
export interface LatticeWebsiteProps {
    /**
     * Logical name of the website.
     * @example "user-dashboard"
     */
    name: string;

    /**
     * Deployment environment.
     */
    environment: Environment;

    /**
     * Local path to the build artifacts (e.g., HTML/CSS/JS files).
     * @example "./dist" or "./build"
     */
    sourcePath: string;

    /**
     * Custom domain name for the website (optional).
     * @example "app.example.com"
     */
    domainName?: string;

    /**
     * The file to serve for 404 errors or SPA routing.
     * @default "index.html"
     */
    errorPage?: string;
}

export interface LatticeWebsiteConstruct {
    output: {
        bucketName: string;
        distributionId: string;
        domainName: string;
        websiteUrl: string;
    };
}
