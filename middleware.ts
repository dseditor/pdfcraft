import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createMiddleware(routing);

// Locale prefix for zh-TW
const localePattern = /^\/(zh-TW)(\/|$)/;

function addSecurityHeaders(response: NextResponse): void {
    // Required for SharedArrayBuffer (LibreOffice WASM)
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
}

export default function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Redirect any non-zh-TW locale paths to zh-TW equivalent
    const otherLocaleMatch = pathname.match(/^\/(en|ja|ko|es|fr|de|zh|pt|ar|it)(\/|$)/);
    if (otherLocaleMatch) {
        const matchedLocale = otherLocaleMatch[1];
        const rest = pathname.slice(matchedLocale.length + 1); // remove "/<locale>"
        const url = request.nextUrl.clone();
        url.pathname = `/zh-TW${rest || '/'}`;
        const response = NextResponse.redirect(url);
        addSecurityHeaders(response);
        response.cookies.set('NEXT_LOCALE', 'zh-TW', { path: '/' });
        return response;
    }

    // No locale prefix: redirect to zh-TW
    if (!localePattern.test(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = `/zh-TW${pathname === '/' ? '' : pathname}`;
        const response = NextResponse.redirect(url);
        addSecurityHeaders(response);
        response.cookies.set('NEXT_LOCALE', 'zh-TW', { path: '/' });
        return response;
    }

    // zh-TW path: let next-intl handle normally
    const response = intlMiddleware(request);
    addSecurityHeaders(response);
    return response;
}

export const config = {
    matcher: [
        '/((?!api|_next|_vercel|.*\\..*).*)',
    ],
};
