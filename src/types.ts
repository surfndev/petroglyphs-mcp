export interface Combo {
  id: string;
  name: string;
  icon: string;
  prompt: string;
  auto_action: string | null;
  color: string;
}

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
  timestamp: number;
}

export interface StrokeMetadata {
  strokeCount: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  duration: number;
  strokes?: Array<{
    points: StrokePoint[];
  }>;
}

export interface Submission {
  id: string;
  timestamp: string;
  imageBase64: string;
  mimeType: string;
  strokeMetadata: StrokeMetadata;
  combo: Combo | null;
}

export interface Config {
  port: number;
  vaultPath: string | null;
  exportPath: string;
  maxHistory: number;
}
