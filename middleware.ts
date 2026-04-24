import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard"];

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({ request: { headers: req.headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 未配置 Supabase：直接放行，同时保护路由重定向到 sign-in
  if (!url || !anonKey) {
    const { pathname } = req.nextUrl;
    const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
    if (needsAuth) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/sign-in";
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: req.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: req.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // 刷新 session（关键：Server Components 才能拿到最新登录态）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 保护路由
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (needsAuth && !user) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/sign-in";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，排除：
     * - _next/static (静态资源)
     * - _next/image
     * - favicon.ico / sitemap / robots / feed / og-default / logo
     * - api/webhooks (webhook 不能走 session 逻辑，会影响签名验证)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|feed.xml|og-default.png|logo.png|api/webhooks).*)",
  ],
};
