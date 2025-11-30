
export interface LogMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: Date;
  citations?: string[];
}

export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface AudioVisualizerData {
  volume: number; // 0 to 1
}

export interface StockDataPoint {
  date: string;
  price: number;
}

export interface StockChartData {
  symbol: string;
  currency: string;
  period: string;
  data: StockDataPoint[];
  trend: 'up' | 'down';
  changePercent: number;
}

export interface AnalysisResult {
  symbol: string;
  content: string;
  isLoading: boolean;
  timestamp: Date;
}

export interface Command {
  id: string;
  category: string;
  label: string;
  text: string;
}
