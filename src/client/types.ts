export interface PagedList<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface AffectedEntries {
  count: number;
}

export interface ServerInfo {
  localUtcOffset: string;
  startTime: string;
  operatingSystem: string;
  currentWorkingDirectory: string;
  buildNumber: string;
  buildDate: string;
  clientIpAddress: string;
}

export interface Announcement {
  markdownText: string;
  lastFetched: string;
}

export interface Changelog {
  markdownText: string;
  version: string;
}

export interface UpdateInfo {
  currentVersion: string;
  remoteVersion: string;
  isUpdateAvailable: boolean;
  currentVersionType: string;
  remoteVersionType: string;
}

export interface CollectionInfo {
  jobsCount: number;
  proxiesCount: number;
  wordlistsCount: number;
  wordlistsLines: number;
  hitsCount: number;
  configsCount: number;
  guestsCount: number;
  pluginsCount: number;
}

export interface UserLoginDto {
  username: string;
  password: string;
}

export interface LoggedInUserDto {
  token: string;
}

export interface ConfigInfoDto {
  id: string;
  name: string;
  base64Image: string;
  author: string;
  category: string;
  isRemote: boolean;
  needsProxies: boolean;
  allowedWordlistTypes: string[];
  creationDate: string;
  lastModified: string;
  mode: string;
  dangerous: boolean;
  suggestedBots: number;
}

export interface ConfigMetadataDto {
  name: string;
  category: string;
  author: string;
  base64Image: string;
  creationDate: string;
  lastModified: string;
  plugins: string[];
}

export interface ConfigReadmeDto {
  id: string;
  markdown: string;
}

export interface ConfigDto {
  id: string;
  isRemote: boolean;
  mode: string;
  metadata: ConfigMetadataDto;
  settings: ConfigSettingsDto;
  readme: string;
  loliCodeScript: string;
  startupLoliCodeScript: string;
  loliScript: string;
  startupCSharpScript: string;
  cSharpScript: string;
}

export interface ConfigSettingsDto {
  allowBinaryResponses: boolean;
  encodeData: boolean;
  forceEncodeData: boolean;
  separateCaptchaContent: boolean;
  urlEncodedPostData: boolean;
  skipDefaultCaptchaSetup: boolean;
  usingCustomInputs: boolean;
  ignoreResponseErrors: boolean;
  maxEmptyResponses: number;
  successNewLine: boolean;
  clearCookies: boolean;
  exitOnEnd: boolean;
  forceSni: boolean;
  decodeGzip: boolean;
  decodeImage: boolean;
  autoDecode: boolean;
  proxyRules: ProxyRuleDto[];
  allowedWordlistTypes: string[];
  wordlistPurposes: string[];
  dataRules: DataRuleDto[];
  captureGroups: CaptureGroupDto[];
}

export interface ProxyRuleDto {
  key: string;
  value: string;
}

export interface DataRuleDto {
  slice: string;
  regex: string;
  antiBot: boolean;
}

export interface CaptureGroupDto {
  name: string;
  color: string;
}

export interface UpdateConfigDto {
  id: string;
  mode: string;
  metadata: ConfigMetadataDto;
  settings: ConfigSettingsDto;
  readme: string;
  loliCodeScript: string;
  startupLoliCodeScript: string;
  loliScript: string;
  startupCSharpScript: string;
  cSHScript: string;
  persistent: boolean;
}

export interface DebugConfigDto {
  configId: string;
  testData: string;
  wordlistType: string;
  testProxy?: string | null;
  proxyType?: string;
}

export interface DebugConfigResultDto {
  log: string[];
  variables: Record<string, string>;
  error?: string;
}

export interface ConvertLoliCodeToCSharpDto {
  loliCode: string;
}

export interface ConvertedCSharpDto {
  csharpCode: string;
}

export interface ConvertLoliCodeToStackDto {
  loliCode: string;
}

export interface ConvertStackToLoliCodeDto {
  stack: string;
}

export interface ConvertedStackDto {
  stack: string;
}

export interface ConvertedLoliCodeDto {
  loliCode: string;
}

export interface BlockDescriptorDto {
  name: string;
  description: string;
  category: string;
  parameters: BlockParameterDto[];
  hasSettings: boolean;
  hasBody: boolean;
  bodyType?: string;
}

export interface BlockParameterDto {
  name: string;
  description: string;
  type: string;
  defaultValue: string;
  required: boolean;
}

export interface CategoryTreeNodeDto {
  name: string;
  subCategories: CategoryTreeNodeDto[];
  descriptorIds: string[];
}

export interface JobOverviewDto {
  id: number;
  name: string;
  type: string;
  status: string;
  bots: number;
  cpm: number;
  elapsed: string;
  progress: number;
  ownerId?: string;
}

export interface MultiRunJobOverviewDto {
  id: number;
  name: string;
  status: string;
  configName: string;
  configId: string;
  bots: number;
  cpm: number;
  elapsed: string;
  progress: number;
  hits: number;
  ownerId?: string;
}

export interface ProxyCheckJobOverviewDto {
  id: number;
  name: string;
  status: string;
  groupName: string;
  groupId: number;
  bots: number;
  cpm: number;
  elapsed: string;
  progress: number;
  working: number;
  notWorking: number;
  ownerId?: string;
}

export interface MultiRunJobDto {
  id: number;
  name: string;
  startTime: string;
  ownerId?: string;
  type: string;
  status: string;
  startCondition: string;
  config?: ConfigInfoDto;
  dataPoolInfo: string;
  bots: number;
  skip: number;
  proxyMode: string;
  proxySources: string[];
  hitOutputs: string[];
  dataStats: DataStatsDto;
  proxyStats: ProxyStatsDto;
  cpm: number;
  captchaCredit: number;
  elapsed: string;
  remaining: string;
  progress: number;
  hits: HitDto[];
}

export interface DataStatsDto {
  total: number;
  tested: number;
  skipped: number;
  remaining: number;
}

export interface ProxyStatsDto {
  total: number;
  good: number;
  banned: number;
  errors: number;
  remaining: number;
}

export interface ProxyCheckJobDto {
  id: number;
  name: string;
  startTime: string;
  ownerId?: string;
  type: string;
  status: string;
  startCondition: string;
  bots: number;
  groupId: number;
  groupName: string;
  checkOnlyUntested: boolean;
  target?: string;
  timeoutMilliseconds: number;
  checkOutput: string;
  total: number;
  tested: number;
  working: number;
  notWorking: number;
  cpm: number;
  elapsed: string;
  remaining: string;
  progress: number;
}

export interface MultiRunJobOptionsDto {
  name: string;
  configId: string;
  startCondition: string;
  bots: number;
  skip: number;
  proxyMode: string;
  shuffleProxies: boolean;
  noValidProxyBehaviour: string;
  proxyBanTimeSeconds: number;
  markAsToCheckOnAbort: boolean;
  neverBanProxies: boolean;
  concurrentProxyMode: string;
  periodicReloadIntervalSeconds: number;
  dataPool: Record<string, unknown>;
  proxySources: Record<string, unknown>[];
  hitOutputs: Record<string, unknown>[];
}

export interface ProxyCheckJobOptionsDto {
  name: string;
  startCondition: string;
  bots: number;
  groupId: number;
  checkOnlyUntested: boolean;
  target?: string;
  timeoutMilliseconds: number;
  checkOutput: Record<string, unknown>;
}

export interface CreateMultiRunJobDto {
  configId: string;
  name: string;
  startCondition?: string;
  bots: number;
  skip: number;
  proxyMode: string;
  shuffleProxies: boolean;
  noValidProxyBehaviour: string;
  proxyBanTimeSeconds: number;
  markAsToCheckOnAbort: boolean;
  neverBanProxies: boolean;
  concurrentProxyMode: string;
  periodicReloadIntervalSeconds: number;
  dataPool?: Record<string, unknown>;
  proxySources?: Record<string, unknown>[];
  hitOutputs?: Record<string, unknown>[];
}

export interface UpdateMultiRunJobDto {
  id: number;
  name: string;
  startCondition?: string;
  configId: string;
  bots: number;
  skip: number;
  proxyMode: string;
  shuffleProxies: boolean;
  noValidProxyBehaviour: string;
  proxyBanTimeSeconds: number;
  markAsToCheckOnAbort: boolean;
  neverBanProxies: boolean;
  concurrentProxyMode: string;
  periodicReloadIntervalSeconds: number;
  dataPool?: Record<string, unknown>;
  proxySources?: Record<string, unknown>[];
  hitOutputs?: Record<string, unknown>[];
}

export interface CreateProxyCheckJobDto {
  bots: number;
  name: string;
  startCondition?: string;
  groupId: number;
  checkOnlyUntested: boolean;
  target?: string;
  timeoutMilliseconds: number;
  checkOutput?: Record<string, unknown>;
}

export interface UpdateProxyCheckJobDto {
  id: number;
  name: string;
  startCondition?: string;
  bots: number;
  groupId: number;
  checkOnlyUntested: boolean;
  target?: string;
  timeoutMilliseconds: number;
  checkOutput?: Record<string, unknown>;
}

export interface JobCommandDto {
  jobId: number;
  wait: boolean;
}

export interface ChangeBotsDto {
  jobId: number;
  bots: number;
}

export interface CustomInputQuestionDto {
  variableName: string;
  question: string;
  defaultValue: string;
}

export interface CustomInputsDto {
  jobId: number;
  answers: { variableName: string; answer: string }[];
}

export interface BotDetailsDto {
  number: number;
  status: string;
  currentBlock: string;
  currentProxy: string;
  currentData: string;
  log: string[];
  variables: Record<string, string>;
}

export interface RecordDto {
  configId: string;
  wordlistId: number;
  checkpoint: number;
}

export interface MrjHitLogDto {
  log: string[];
  variables: Record<string, string>;
}

export interface HitDto {
  id: number;
  data: string;
  capturedData: string;
  proxy: string;
  date: string;
  type: string;
  ownerId?: string;
  configId?: string;
  configName: string;
  configCategory: string;
  wordlistId: number;
  wordlistName: string;
}

export interface CreateHitDto {
  data: string;
  capturedData: string;
  proxy?: string;
  date?: string;
  type: string;
  configId?: string;
  configName?: string;
  configCategory?: string;
  wordlistId: number;
  wordlistName?: string;
}

export interface UpdateHitDto {
  id: number;
  data: string;
  capturedData: string;
  type: string;
}

export interface HitFiltersDto {
  searchTerm?: string;
  configName?: string;
  types?: string;
  minDate?: string;
  maxDate?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface PaginatedHitFiltersDto extends HitFiltersDto {
  pageNumber: number;
  pageSize: number;
}

export interface SendToRecheckResultDto {
  jobId: number;
}

export interface RecentHitsDto {
  dates: string[];
  hits: Record<string, number[]>;
}

export interface ProxyDto {
  id: number;
  host: string;
  port: number;
  type: string;
  username?: string;
  password?: string;
  country?: string;
  status: string;
  ping: number;
  lastChecked?: string;
  groupId: number;
  groupName: string;
}

export interface ProxyFiltersDto {
  proxyGroupId: number;
  searchTerm?: string;
  type?: string;
  status?: string;
  sortBy?: string;
  sortDescending?: boolean;
  pageNumber: number;
  pageSize: number;
}

export interface AddProxiesFromListDto {
  proxyGroupId: number;
  proxies: string[];
  defaultType: string;
  defaultUsername: string;
  defaultPassword: string;
}

export interface AddProxiesFromRemoteDto {
  proxyGroupId: number;
  url: string;
  defaultType: string;
  defaultUsername: string;
  defaultPassword: string;
}

export interface MoveProxiesDto {
  proxyGroupId: number;
  searchTerm?: string;
  type?: string;
  status?: string;
  sortBy?: string;
  sortDescending?: boolean;
  pageNumber: number;
  pageSize: number;
  destinationGroupId: number;
}

export interface ProxyGroupDto {
  id: number;
  name: string;
  owner?: string;
}

export interface CreateProxyGroupDto {
  name: string;
}

export interface UpdateProxyGroupDto {
  id: number;
  name: string;
}

export interface WordlistDto {
  id: number;
  name: string;
  filePath: string;
  purpose: string;
  lineCount: number;
  wordlistType: string;
  owner?: string;
}

export interface WordlistPreviewDto {
  firstLines: string[];
  sizeInBytes: number;
}

export interface CreateWordlistDto {
  name: string;
  purpose: string;
  wordlistType: string;
  filePath: string;
}

export interface UpdateWordlistInfoDto {
  id: number;
  name: string;
  purpose: string;
  wordlistType: string;
}

export interface WordlistFileDto {
  filePath: string;
}

export interface GuestDto {
  id: number;
  username: string;
  accessExpiration: string;
  allowedAddresses: string[];
}

export interface CreateGuestDto {
  username: string;
  password: string;
  accessExpiration: string;
  allowedAddresses: string[];
}

export interface UpdateGuestInfoDto {
  id: number;
  username: string;
  accessExpiration: string;
  allowedAddresses: string[];
}

export interface UpdateGuestPasswordDto {
  id: number;
  password: string;
}

export interface SystemSettingsDto {
  botLimit: number;
}

export interface EnvironmentSettingsDto {
  wordlistTypes: WordlistTypeSettingDto[];
  customStatuses: CustomStatusSettingDto[];
  exportFormats: ExportFormatSettingDto[];
}

export interface WordlistTypeSettingDto {
  name: string;
  regex: string;
  verify: boolean;
  separator: string;
  slices: string;
}

export interface CustomStatusSettingDto {
  name: string;
  color: string;
}

export interface ExportFormatSettingDto {
  format: string;
}

export interface OpenBulletSettingsDto {
  generalSettings: Record<string, unknown>;
  remoteSettings: Record<string, unknown>;
  securitySettings: Record<string, unknown>;
  customizationSettings: Record<string, unknown>;
}

export interface SafeOpenBulletSettingsDto {
  generalSettings: Record<string, unknown>;
  customizationSettings: Record<string, unknown>;
}

export interface PluginDto {
  name: string;
}

export interface EndpointDto {
  route: string;
  apiKeys: string[];
  configIds: string[];
}

export interface TriggeredActionDto {
  id: string;
  name: string;
  isActive: boolean;
  isRepeatable: boolean;
  executions: number;
  jobId: number;
  jobName: string;
  jobType: string;
  triggers: Record<string, unknown>[];
  actions: Record<string, unknown>[];
}

export interface CreateTriggeredActionDto {
  name: string;
  isActive: boolean;
  isRepeatable: boolean;
  jobId: number;
  triggers: Record<string, unknown>[];
  actions: Record<string, unknown>[];
}

export interface UpdateTriggeredActionDto {
  id: string;
  name: string;
  isActive: boolean;
  isRepeatable: boolean;
  jobId: number;
  triggers: Record<string, unknown>[];
  actions: Record<string, unknown>[];
}

export interface ThemeDto {
  name: string;
}

export interface CaptchaBalanceDto {
  balance: number;
}

export interface GarbageCollectRequestDto {
  generations: number;
  mode: string;
  blocking: boolean;
  compacting: boolean;
}
