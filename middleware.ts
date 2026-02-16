import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

// Locale prefixes that next-intl recognizes
const localePattern = /^\/(en|ja|ko|es|fr|de|zh-TW|zh|pt|ar|it)(\/|$)/;

// Simplified Chinese sub-tags
const simplifiedTags = new Set(['cn', 'sg', 'hans']);

/**
 * Parse Accept-Language header and determine if the preferred Chinese
 * variant is traditional (zh-TW) rather than simplified (zh).
 *
 * Returns 'zh-TW' | 'zh' | null (null = no Chinese preference).
 */
function getChinesePreference(acceptLang: string): 'zh-TW' | 'zh' | null {
    // Parse entries like "zh-TW,zh;q=0.9,en;q=0.8"
    const entries = acceptLang.split(',').map(entry => {
        const [langRaw, qRaw] = entry.trim().split(';');
        const lang = langRaw.trim().toLowerCase();
        const q = qRaw ? parseFloat(qRaw.replace(/q\s*=\s*/, '')) : 1;
        return { lang, q };
    });

    // Sort by quality descending
    entries.sort((a, b) => b.q - a.q);

    // Find the first Chinese entry
    for (const { lang } of entries) {
        if (!lang.startsWith('zh')) continue;

        const subtag = lang.split(/[-_]/)[1];
        if (!subtag) {
            // Bare "zh" — default to traditional
            return 'zh-TW';
        }
        if (simplifiedTags.has(subtag)) {
            return 'zh';
        }
        // zh-tw, zh-hk, zh-mo, zh-hant → traditional
        return 'zh-TW';
    }

    return null;
}

function addSecurityHeaders(response: NextResponse): void {
    // Required for SharedArrayBuffer (LibreOffice WASM)
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
}

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only intercept when there's no locale prefix yet (first visit / root redirect)
    if (!localePattern.test(pathname)) {
        const acceptLang = request.headers.get('accept-language');
        if (acceptLang) {
            const pref = getChinesePreference(acceptLang);
            if (pref === 'zh-TW') {
                // Redirect to zh-TW before next-intl picks "zh"
                const url = request.nextUrl.clone();
                url.pathname = `/zh-TW${pathname === '/' ? '' : pathname}`;
                const response = NextResponse.redirect(url);
                addSecurityHeaders(response);
                return response;
            }
        }
    }

    const response = intlMiddleware(request);
    addSecurityHeaders(response);
    return response;
}

export const config = {
    matcher: [
        '/((?!api|_next|_vercel|.*\\..*).*)',
    ],
};
