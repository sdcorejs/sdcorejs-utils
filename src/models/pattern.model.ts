export type SdPatternType = 'EMAIL' | 'PHONE' | 'PHONE_VN' | 'IDVN' | 'PASSPORT' | 'IDVN_OR_PASSPORT' | 'TIME';

export interface SdPatternCommon {
  type: SdPatternType;
  name: string;
  regex: string;
  errorMessage: string;
}
