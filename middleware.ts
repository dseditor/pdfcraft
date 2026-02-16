import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

// Locale prefixes that next-intl recognizes
const localePattern = /^\/(en|ja|ko|es|fr|de|zh-TW|zh|pt|ar|it)(\/|$)/;

/**
 * Check if Accept-Language contains any Chinese variant.
 */
function hasChinesePreference(acceptLang: string): boolean {
    return acceptLang.toLowerCase().includes('zh');
}

function addSecurityHeaders(response: NextResponse): void {
    // Required for SharedArrayBuffer (LibreOffice WASM)
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
}

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. If user is on /zh/... path, redirect to /zh-TW/... equivalent
    const zhMatch = pathname.match(/^\/zh(\/|$)/);
    if (zhMatch) {
        const rest = pathname.slice(3); // remove "/zh"
        const url = request.nextUrl.clone();
        url.pathname = `/zh-TW${rest || '/'}`;
        const response = NextResponse.redirect(url);
        addSecurityHeaders(response);
        // Override the locale cookie to zh-TW
        response.cookies.set('NEXT_LOCALE', 'zh-TW', { path: '/' });
        return response;
    }

    // 2. No locale prefix: check Accept-Language & cookie for Chinese
    if (!localePattern.test(pathname)) {
        const acceptLang = request.headers.get('accept-language') || '';
        const localeCookie = request.cookies.get('NEXT_LOCALE')?.value;

        // If cookie is "zh" or Accept-Language has any Chinese → redirect to zh-TW
        if (localeCookie === 'zh' || hasChinesePreference(acceptLang)) {
            const url = request.nextUrl.clone();
            url.pathname = `/zh-TW${pathname === '/' ? '' : pathname}`;
            const response = NextResponse.redirect(url);
            addSecurityHeaders(response);
            response.cookies.set('NEXT_LOCALE', 'zh-TW', { path: '/' });
            return response;
        }
    }

    // 3. All other cases: let next-intl handle normally
    const response = intlMiddleware(request);
    addSecurityHeaders(response);
    return response;
}

export const config = {
    matcher: [
        '/((?!api|_next|_vercel|.*\\..*).*)',
    ],
};
