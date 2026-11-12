import type {DiscoveryAnswerInput, DiscoveryDomain, DiscoveryMood, DiscoveryQuestion, DiscoveryResponse} from './core/types';
import type {DiscoveryFeedback, DiscoveryProfile, DiscoverySettings} from './core/contracts';
import {discoveryDomain} from './core/taxonomy';
import {validateDiscoveryResponse} from './core/validation';
import {discoveryMood} from './core/mood';
import type {DailyNotificationQuestion} from './push-registration';

export type {DiscoveryAnswerInput, DiscoveryDomain, DiscoveryMood, DiscoveryQuestion, DiscoveryResponse} from './core/types';
export {DISCOVERY_MOODS} from './core/mood';
export type {DiscoveryFeedback, DiscoveryProfile, DiscoverySettings, SavedDiscoveryAnswer} from './core/contracts';
export {DISCOVERY_DOMAINS, discoveryDomainLabel} from './core/taxonomy';

export interface MutationInput {requestId: string; expectedGeneration: number}
export interface SaveAnswersInput extends MutationInput {answers: DiscoveryAnswerInput[]}
export interface RemoveAnswerInput extends MutationInput {expectedRevision: number}
export interface EditAnswerInput extends RemoveAnswerInput {response?: DiscoveryResponse; active?: boolean}
export interface FeedbackInput extends MutationInput {insightId: string; feedback: DiscoveryFeedback}
export interface NextQuestionInput extends MutationInput {
  topic?: DiscoveryDomain | null;
  mode?: 'light' | 'curious' | 'reflect';
  mood?: DiscoveryMood | null;
  localHour?: number;
  sessionAnswers?: number;
  consecutiveSkips?: number;
  continueAfterPause?: boolean;
  daily?: boolean;
  change?: boolean;
  notificationQuestion?: DailyNotificationQuestion;
}
export interface NextQuestionResult {
  question: DiscoveryQuestion | null;
  reason: 'coverage' | 'explore' | 'relevant' | 'pause' | 'exhausted';
  generation: number;
  answered?: boolean;
  selectorVersion?: 1;
  score?: number;
}
export interface SaveResult {saved: true; generation: number; answerIds?: string[]}
export class DiscoveryApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
    this.name = 'DiscoveryApiError';
  }
}

type RecordValue = Record<string, unknown>;
const record = (v: unknown): v is RecordValue => !!v && typeof v === 'object' && !Array.isArray(v);
const integer = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0;
const string = (v: unknown): v is string => typeof v === 'string';
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(string);
function utf8Size(value: string): number {
  let bytes = 0;
  for (const character of value) {
    const point = character.codePointAt(0)!;
    bytes += point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4;
  }
  return bytes;
}
const uuid = (v: unknown): v is string => string(v) && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const oneOf = (v: unknown, values: readonly string[]) => string(v) && values.includes(v);
const unavailable = () => new DiscoveryApiError(503, 'unavailable', 'Could not load this step. Check your connection and try again.');
const invalid = () => new DiscoveryApiError(400, 'invalid_request', 'Reload your answers and review this change before saving.');
const knownCodes = new Set(['unauthenticated','forbidden','needs_terms','unavailable','changed','not_found','rate_limit','invalid_request','too_large','support']);

function question(value: unknown): value is DiscoveryQuestion {
  if (!record(value) || !string(value.id) || !integer(value.version) || value.version < 1 || !string(value.familyId)
    || !discoveryDomain(value.domain) || !string(value.subdomain) || !string(value.prompt)
    || !oneOf(value.format, ['choice','scale','ranking','text']) || !oneOf(value.status, ['published','draft','retired'])
    || !oneOf(value.source, ['starter','existing','generated']) || !oneOf(value.purpose, ['evidence','playful'])
    || !oneOf(value.sensitivity, ['ordinary','optional']) || !integer(value.depth) || value.depth > 2
    || !integer(value.estimatedSeconds) || !strings(value.allowedResponses)
    || !value.allowedResponses.every(v => oneOf(v, ['both','depends','neither','skip']))) return false;
  if (value.choices !== undefined && (!Array.isArray(value.choices) || !value.choices.every(c => record(c) && string(c.id) && string(c.label)))) return false;
  if (value.format === 'choice' && (!Array.isArray(value.choices) || value.choices.length < 2)) return false;
  if (value.format === 'scale') {
    const scale = value.scale;
    if (!record(scale) || ![scale.min,scale.max,scale.step].every(v => typeof v === 'number' && Number.isFinite(v))
      || (scale.step as number) <= 0 || (scale.min as number) >= (scale.max as number)
      || !string(scale.minLabel) || !string(scale.maxLabel)) return false;
  }
  if (value.format === 'ranking') {
    const ranking = value.ranking;
    if (!Array.isArray(value.choices) || !record(ranking) || !integer(ranking.min) || !integer(ranking.max)
      || ranking.max < ranking.min || typeof ranking.allowTies !== 'boolean') return false;
  }
  return true;
}

function settings(value: unknown): value is DiscoverySettings {
  return record(value) && Array.isArray(value.mutedTopics) && value.mutedTopics.every(v => !!discoveryDomain(v))
    && typeof value.optionalTopics === 'boolean' && integer(value.maxDepth) && value.maxDepth <= 2
    && typeof value.writtenAnswers === 'boolean' && typeof value.metricsEnabled === 'boolean';
}

function profile(value: unknown): value is DiscoveryProfile {
  if (!record(value) || typeof value.available !== 'boolean' || !integer(value.generation)
    || (value.today !== undefined && !string(value.today)) || !strings(value.suppressedQuestionIds)
    || !record(value.capabilities) || typeof value.capabilities.writtenAnswers !== 'boolean' || typeof value.capabilities.optionalTopics !== 'boolean'
    || !settings(value.settings) || !record(value.counts) || ![value.counts.answers,value.counts.domains,value.counts.confirmed].every(integer)
    || !Array.isArray(value.answers) || !Array.isArray(value.insights) || !Array.isArray(value.exposures)) return false;
  if (!value.answers.every(a => record(a) && uuid(a.id) && question(a.question) && a.questionId === a.question.id
    && a.questionVersion === a.question.version && integer(a.revision) && typeof a.active === 'boolean' && string(a.answeredAt)
    && (a.useInProfile === undefined || typeof a.useInProfile === 'boolean') && !!validateDiscoveryResponse(a.question, a.response).value)) return false;
  if (!value.insights.every(i => record(i) && string(i.id) && string(i.title) && string(i.statement) && string(i.domain)
    && strings(i.evidenceIds) && strings(i.questionIds) && oneOf(i.state, ['you_said','early_signal','repeated_pattern','mixed','user_confirmed'])
    && (i.feedback === undefined || oneOf(i.feedback, ['fits','sometimes','not_me'])))) return false;
  return value.exposures.every(e => record(e) && string(e.questionId) && string(e.familyId) && string(e.servedAt)
    && oneOf(e.state, ['served','answered','skipped','changed']) && (e.daily === undefined || typeof e.daily === 'boolean')
    && (e.localDay === undefined || string(e.localDay)) && (e.questionVersion === undefined || integer(e.questionVersion)));
}

function nextResult(value: unknown): value is NextQuestionResult {
  if (!record(value) || !integer(value.generation) || (value.answered !== undefined && typeof value.answered !== 'boolean')) return false;
  return value.question === null ? oneOf(value.reason, ['pause','exhausted'])
    : question(value.question) && value.question.status === 'published' && oneOf(value.reason, ['coverage','explore','relevant']);
}
function saved(value: unknown): value is SaveResult {
  return record(value) && value.saved === true && integer(value.generation)
    && (value.answerIds === undefined || Array.isArray(value.answerIds) && value.answerIds.every(uuid));
}

/** Bearer-only native transport. Callers retain request IDs and decide whether to retry. */
export class DiscoveryApi {
  private readonly baseUrl: string;
  private readonly transport: typeof fetch;
  private readonly accessToken: () => Promise<string | null>;

  constructor(options: {baseUrl: string; accessToken: () => Promise<string | null>; fetch?: typeof fetch}) {
    let url: URL;
    try { url = new URL(options.baseUrl); } catch { throw new Error('Nudge needs a valid HTTPS API origin.'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash)
      throw new Error('Nudge needs a valid HTTPS API origin.');
    this.baseUrl = url.origin;
    this.transport = options.fetch ?? fetch;
    this.accessToken = options.accessToken;
  }

  async profile(): Promise<DiscoveryProfile> { return this.call('profile', 'GET', undefined, profile); }
  async next(input: NextQuestionInput): Promise<NextQuestionResult> {
    this.checkMutation(input);
    if (input.mood !== undefined && input.mood !== null && !discoveryMood(input.mood)) throw invalid();
    return this.call('next', 'POST', input, nextResult);
  }
  async claim(input: SaveAnswersInput): Promise<SaveResult> { return this.save('claim', input, 6); }
  async answer(input: SaveAnswersInput): Promise<SaveResult> { return this.save('answers', input, 1); }
  async edit(id: string, input: EditAnswerInput): Promise<SaveResult> {
    this.checkEdit(id, input);
    if (input.response === undefined && input.active === undefined) throw invalid();
    return this.call(`answers/${id}`, 'PATCH', input, saved);
  }
  async remove(id: string, input: RemoveAnswerInput): Promise<SaveResult> {
    this.checkEdit(id, input);
    return this.call(`answers/${id}`, 'DELETE', input, saved);
  }
  async settings(input: DiscoverySettings & {expectedGeneration: number}): Promise<{saved: true}> {
    if (!integer(input.expectedGeneration) || !settings(input)) throw invalid();
    return this.call('settings', 'POST', input, (value): value is {saved: true} => record(value) && value.saved === true);
  }
  async feedback(input: FeedbackInput): Promise<SaveResult> {
    this.checkMutation(input);
    return this.call('insights/feedback', 'POST', input, saved);
  }

  private checkMutation(input: MutationInput) {
    if (!integer(input.expectedGeneration) || !uuid(input.requestId)) throw invalid();
  }
  private checkEdit(id: string, input: RemoveAnswerInput) {
    this.checkMutation(input);
    if (!uuid(id) || !integer(input.expectedRevision)) throw invalid();
  }
  private async save(path: string, input: SaveAnswersInput, limit: number): Promise<SaveResult> {
    this.checkMutation(input);
    if (!Array.isArray(input.answers) || input.answers.length < 1 || input.answers.length > limit) throw invalid();
    return this.call(path, 'POST', input, saved);
  }

  private async call<T>(path: string, method: string, body: unknown, validate: (value: unknown) => value is T): Promise<T> {
    // Freeze the wire intent before token refresh yields. A retry belongs to this
    // request ID, generation and answer snapshot, even if UI state changes later.
    let wireBody: string | undefined;
    try { wireBody = body === undefined ? undefined : JSON.stringify(body); }
    catch { throw invalid(); }
    if (wireBody !== undefined && (wireBody.length > 24000 || utf8Size(wireBody) > 24000))
      throw new DiscoveryApiError(413, 'too_large', 'This answer is too long. Shorten it before saving.');
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Do not leave token refresh or a stalled body stream waiting indefinitely.
    const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => {
      controller.abort();
      reject(new DiscoveryApiError(0, 'timeout', method === 'GET'
        ? 'Your answers are taking longer to load. Check your connection, then reload.'
        : 'This is taking longer than expected. Your change may have saved. Retry the same change or reload your answers.'));
    }, 20_000); });
    const perform = async (): Promise<T> => {
      const token = await this.accessToken();
      if (!token || /[\s,]/.test(token)) throw new DiscoveryApiError(401, 'unauthenticated', 'Sign in again to load or save your answers.');
      if (controller.signal.aborted) throw unavailable();
      const response = await this.transport(`${this.baseUrl}/api/v1/discovery/${path}`, {
        method, headers: {'Accept': 'application/json', 'Authorization': `Bearer ${token}`, ...(wireBody === undefined ? {} : {'Content-Type': 'application/json'})},
        ...(wireBody === undefined ? {} : {body: wireBody}),
        signal: controller.signal, credentials: 'omit', cache: 'no-store', redirect: 'error',
      });
      if (response.url && new URL(response.url).origin !== this.baseUrl) throw unavailable();
      let value: unknown;
      try { value = await response.json(); } catch { throw unavailable(); }
      if (!response.ok) {
        if (record(value) && record(value.error) && string(value.error.code) && knownCodes.has(value.error.code)
          && string(value.error.message) && value.error.message.length <= 1000)
          throw new DiscoveryApiError(response.status, value.error.code, value.error.message);
        throw unavailable();
      }
      if (!validate(value)) throw unavailable();
      return value;
    };
    try { return await Promise.race([perform(), timeout]); }
    catch (error) {
      if (error instanceof DiscoveryApiError) throw error;
      throw new DiscoveryApiError(0, 'offline', method === 'GET'
        ? 'Could not load your answers. Check your connection, then reload.'
        : 'Could not reach Nudge. Your change may have saved. Check your connection, then retry or reload.');
    } finally { if (timer !== undefined) clearTimeout(timer); }
  }
}
