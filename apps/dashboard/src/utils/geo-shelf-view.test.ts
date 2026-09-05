import { beforeEach, describe, expect, test } from "bun:test";

import { localStorageKeys } from "@/constants/storage";

import {
  getGeoShelfView,
  setGeoShelfView,
  subscribeGeoShelfView,
} from "./geo-shelf-view";

class TestWindow extends EventTarget {
  storedView: string | null = null;
  writeError = false;

  localStorage = {
    getItem: () => this.storedView,
    setItem: (_key: string, value: string) => {
      if (this.writeError) {
        throw new Error("Storage unavailable");
      }
      this.storedView = value;
    },
  };
}

function storageEvent(key: string | null): StorageEvent {
  const event = new Event("storage");
  Object.defineProperty(event, "key", { value: key });
  return event as StorageEvent;
}

let testWindow: TestWindow;

beforeEach(() => {
  testWindow = new TestWindow();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: testWindow,
  });
  setGeoShelfView("table");
});

describe("subscribeGeoShelfView", () => {
  test("notifies for cross-tab changes and removes the listener on cleanup", () => {
    let notifications = 0;
    const unsubscribe = subscribeGeoShelfView(() => {
      notifications += 1;
    });

    testWindow.dispatchEvent(storageEvent("unrelated-key"));
    testWindow.dispatchEvent(storageEvent(localStorageKeys.geoShelfView));
    expect(notifications).toBe(1);

    unsubscribe();
    testWindow.dispatchEvent(storageEvent(localStorageKeys.geoShelfView));
    expect(notifications).toBe(1);
  });
});

describe("setGeoShelfView", () => {
  test("prefers the requested view after persistence fails", () => {
    testWindow.storedView = "table";
    testWindow.writeError = true;

    setGeoShelfView("board");

    expect(testWindow.storedView).toBe("table");
    expect(getGeoShelfView()).toBe("board");

    testWindow.writeError = false;
    setGeoShelfView("table");
  });
});
