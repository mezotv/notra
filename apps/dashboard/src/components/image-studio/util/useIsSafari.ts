import { useEffect, useState } from "react";

export default function useIsSafari() {
  const [isSafari, setSafari] = useState(false);

  useEffect(() => {
    const result =
      navigator.userAgent.indexOf("Safari") > -1 &&
      navigator.userAgent.indexOf("Chrome") <= -1;
    setSafari(result);
  }, []);

  return isSafari;
}
