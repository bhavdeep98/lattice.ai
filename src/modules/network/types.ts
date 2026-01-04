import { BaseResourceProps, NetworkOutput } from '../../core/types';

export interface LatticeNetworkProps extends BaseResourceProps {
  cidr: string;
  highAvailability?: boolean;
  enhancedSecurity?: boolean;
  publicSubnets?: number;
  privateSubnets?: number;
  enableNatGateway?: boolean;
  enableVpcFlowLogs?: boolean;
}

export interface LatticeNetworkConstruct {
  readonly output: NetworkOutput;
}