import type {
  TransmittalPurpose,
  TransmittalAttachment,
  SubmittalOutputOptions,
} from '../../../lib/types/submittals';

export interface PrintSettings {
  outputType: 'pdf' | 'email' | 'email_link';
  outputOptions: SubmittalOutputOptions;
  transmittal: {
    attached: TransmittalAttachment[];
    attachedOther: string;
    transmittedFor: TransmittalPurpose[];
    transmittedForOther: string;
    copies: number;
  };
  selectedItemIds: string[];
  capFileSize: string;
}
