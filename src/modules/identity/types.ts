import { BaseResourceProps, IdentityOutput } from '../../core/types';

export type IdentityRole = 'application' | 'service' | 'admin' | 'readonly';

export interface LatticeIdentityProps extends BaseResourceProps {
  role: IdentityRole;
  programmaticAccess?: boolean;
  policies?: string[];
  customPolicyStatements?: any[];
  trustedServices?: string[];
  externalId?: string;
}

export interface LatticeIdentityConstruct {
  readonly output: IdentityOutput;
}