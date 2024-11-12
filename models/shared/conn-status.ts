export interface ConnectionStatus {
  coinsLen: number;
  activeConnLen: number;
  inactiveConnLen: number;
  inactiveConn: string[];
  activeConn: string[];
  timestamp: number;
  timestampStr: string;
}
