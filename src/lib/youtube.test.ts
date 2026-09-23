import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { getVideoStats } from "./youtube";

const VIDEO_ID = "Kourq_Lz03U";
const originalKey = process.env.YOUTUBE_API_KEY;

beforeEach(() => { delete process.env.YOUTUBE_API_KEY; });
afterEach(() => {
  mock.restoreAll();
  if (originalKey === undefined) delete process.env.YOUTUBE_API_KEY;
  else process.env.YOUTUBE_API_KEY = originalKey;
});

function watchPage(viewCount: unknown, videoId = VIDEO_ID) {
  return new Response(`<script nonce="test">var ytInitialPlayerResponse = ${JSON.stringify({
    videoDetails: { videoId, title: 'A title with }; and "quotes"', viewCount },
  })};</script>`);
}

test("loads public views without an API key or caching oversized HTML", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async (_url: Parameters<typeof fetch>[0], options?: RequestInit) => {
    assert.equal(options?.cache, "no-store");
    assert.ok(options?.signal);
    return watchPage("57339");
  });
  assert.deepEqual(await getVideoStats(VIDEO_ID), {
    viewCount: 57339, likeCount: null, commentCount: null,
  });
  assert.equal(fetchMock.mock.calls.length, 1);
});

test("prefers the configured API and selects the requested video", async () => {
  process.env.YOUTUBE_API_KEY = "test-key";
  const fetchMock = mock.method(globalThis, "fetch", async () => Response.json({ items: [
    { id: "other-video", statistics: { viewCount: "999999" } },
    { id: VIDEO_ID, statistics: { viewCount: "57339", likeCount: "200", commentCount: "40" } },
  ] }));
  assert.deepEqual(await getVideoStats(VIDEO_ID), { viewCount: 57339, likeCount: 200, commentCount: 40 });
  assert.equal(fetchMock.mock.calls.length, 1);
});

for (const failure of ["quota", "network", "missing-count"] as const) {
  test(`uses public views when the API has a ${failure} failure`, async () => {
    process.env.YOUTUBE_API_KEY = "test-key";
    mock.method(globalThis, "fetch", async (url: Parameters<typeof fetch>[0]) => {
      if (String(url).includes("googleapis.com")) {
        if (failure === "network") throw new Error("Network unavailable");
        if (failure === "quota") return new Response(null, { status: 403 });
        return Response.json({ items: [{ id: VIDEO_ID, statistics: {} }] });
      }
      return watchPage("57339");
    });
    assert.equal((await getVideoStats(VIDEO_ID))?.viewCount, 57339);
  });
}

test("does not request missing or invalid video IDs", async () => {
  const fetchMock = mock.method(globalThis, "fetch");
  for (const id of [null, undefined, "", "bad-id", "../../film?"]) {
    assert.equal(await getVideoStats(id), null);
  }
  assert.equal(fetchMock.mock.calls.length, 0);
});

test("rejects missing, malformed, negative, or unsafe counts", async () => {
  for (const count of [undefined, null, "", "-1", "1.5", "NaN", "57,339", "9007199254740992"]) {
    mock.method(globalThis, "fetch", async () => watchPage(count));
    assert.equal(await getVideoStats(VIDEO_ID), null);
    mock.restoreAll();
  }
});

test("preserves an actual zero-view count", async () => {
  mock.method(globalThis, "fetch", async () => watchPage("0"));
  assert.equal((await getVideoStats(VIDEO_ID))?.viewCount, 0);
});

test("does not mistake another video's count for the requested video", async () => {
  mock.method(globalThis, "fetch", async () => watchPage("999999", "bmWQqAKLgT4"));
  assert.equal(await getVideoStats(VIDEO_ID), null);
});

test("leaves unavailable videos blank without crashing the film page", async () => {
  for (const response of [
    () => new Response("Consent required"),
    () => new Response('<script>var ytInitialPlayerResponse = {broken};</script>'),
    () => new Response(null, { status: 429 }),
    () => { throw new Error("Timeout"); },
  ]) {
    mock.method(globalThis, "fetch", async () => response());
    assert.equal(await getVideoStats(VIDEO_ID), null);
    mock.restoreAll();
  }
});
