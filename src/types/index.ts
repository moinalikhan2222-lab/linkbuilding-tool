export type BacklinkStatus =
  | 'Not Started'
  | 'Processing'
  | 'Signup Completed'
  | 'Login Successful'
  | 'Submitted'
  | 'Pending Approval'
  | 'Published and Verified'
  | 'Published but Unverified'
  | 'Failed'
  | 'Skipped'
  | 'Manual Action Required'
  | 'Published but Verification Failed';

export type LinkAttribute = 'dofollow' | 'nofollow' | 'ugc' | 'sponsored' | 'none' | 'unknown';

export interface TaskLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  step?: string;
}

export interface WebsiteRow {
  id: string;
  originalRowNumber: number;
  websiteName: string;
  websiteUrl: string;
  registrationUrl?: string;
  loginUrl?: string;
  targetUrl: string;
  anchorText: string;
  preferredBacklinkType?: string;
  username?: string;
  passwordEncrypted?: string;
  hasPassword?: boolean;
  additionalInstructions?: string;
  accountStatus: string;
  loginStatus: string;
  emailVerificationStatus: string;
  submissionStatus: string;
  publishedBacklinkUrl?: string;
  linkAttribute: LinkAttribute;
  httpStatus?: number;
  publicationDate?: string;
  lastVerificationDate?: string;
  finalResult: BacklinkStatus;
  failureOrSkipReason?: string;
  requiredManualAction?: string;
  lastAttemptDate?: string;
  retryCount: number;
  logs: TaskLog[];
  screenshotUrl?: string;
}

export interface ColumnMapping {
  websiteUrl: string;
  websiteName?: string;
  registrationUrl?: string;
  loginUrl?: string;
  targetUrl?: string;
  anchorText?: string;
  preferredBacklinkType?: string;
  username?: string;
  password?: string;
  additionalInstructions?: string;
}

export interface CampaignDefaults {
  defaultTargetUrl: string;
  defaultAnchorText: string;
  defaultEmail?: string;
  defaultAuthorName?: string;
  defaultBio?: string;
}

export type CampaignStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'completed';

export interface BrowserLiveState {
  isRunning: boolean;
  activeRowId?: string;
  websiteName?: string;
  currentUrl?: string;
  currentAction?: string;
  stepName?: string;
  screenshotBase64?: string;
  latestError?: string;
  timestamp?: string;
}

export interface CampaignSummary {
  total: number;
  processed: number;
  currentlyProcessing: number;
  signups: number;
  logins: number;
  submitted: number;
  verified: number;
  pending: number;
  failed: number;
  skipped: number;
  manualAction: number;
}
