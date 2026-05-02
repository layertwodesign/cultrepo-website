"use client";

import dynamic from "next/dynamic";

const UnicornScene = dynamic(() => import("unicornstudio-react/next"), {
  ssr: false,
});

export default function UnicornBackground() {
  return (
    <div className="unicorn-bg" aria-hidden>
      <UnicornScene
        projectId="5jTAQ6ZayBHOM08TLJnb"
        sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.1.11/dist/unicornStudio.umd.js"
        width="100%"
        height="100%"
        production
      />
    </div>
  );
}
