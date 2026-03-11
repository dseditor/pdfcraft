/**
 * Tool content exports for all languages
 * Requirements: 3.1 - Multi-language support
 */

export { toolContentEn } from './en';
export { toolContentJa } from './ja';
export { toolContentKo } from './ko';
export { toolContentEs } from './es';
export { toolContentFr } from './fr';
export { toolContentDe } from './de';
export { toolContentZh } from './zh';
export { toolContentZhTW } from './zh-TW';
export { toolContentPt } from './pt';
export { toolContentAr } from './ar';
export { toolContentIt } from './it';

import { toolContentEn } from './en';
import { toolContentJa } from './ja';
import { toolContentKo } from './ko';
import { toolContentEs } from './es';
import { toolContentFr } from './fr';
import { toolContentDe } from './de';
import { toolContentZh } from './zh';
import { toolContentZhTW } from './zh-TW';
import { toolContentPt } from './pt';
import { toolContentAr } from './ar';
import { toolContentIt } from './it';
import { ToolContent } from '@/types/tool';

export type Locale = 'zh-TW';

/**
 * Get tool content for a specific locale
 * Only supports zh-TW
 */
export function getToolContent(locale: Locale, toolId: string): ToolContent | undefined {
  return toolContentZhTW[toolId];
}
