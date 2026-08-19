import { authkitProxy } from "@workos-inc/authkit-nextjs";

export default authkitProxy({
  redirectUri: process.env.NEXT_PUBLIC_WORKOS_REDIRECT_URI,
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|apple-icon.png|icon0.svg|icon1.png|robots.txt).*)",
  ],
};
