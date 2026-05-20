export type PatternType = 'EMAIL' | 'PHONE' | 'PHONE_VN' | 'IDVN' | 'PASSPORT' | 'IDVN_OR_PASSPORT' | 'TIME';

export interface PatternCommon {
  type: PatternType;
  name: string;
  regex: string;
  errorMessage: string;
}
