export interface CommandOptions {
  length?: string;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
  extraSymbols?: boolean;
  excludeSimilar?: boolean;
  excludeAmbiguous?: boolean;
  copy?: boolean;
  save?: boolean;
  showStrength?: boolean;
}
