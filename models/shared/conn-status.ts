export interface ConnectionStatus {
  timestampStr: string;
  coinsLen: number;
  activeConnLen: number;
  inactiveConnLen: number;
  inactiveConn: string[];
  activeConn: string[];
  timestamp: number;
}
