import { authkitProxy } from "@workos-inc/authkit-nextjs";

export default authkitProxy();

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|badges(?:/|$)|favicon.ico|apple-icon.png|icon0.svg|icon1.png|robots.txt).*)",
  ],
};
