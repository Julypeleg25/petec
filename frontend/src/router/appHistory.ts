import {
  Action,
  createBrowserHistory,
  type BrowserHistory,
  type Location,
} from "@remix-run/router";

export interface AppHistoryTransition {
  action: Action;
  location: Location;
  retry: () => void;
}

export type AppHistoryBlocker = (transition: AppHistoryTransition) => void;

export interface BlockableBrowserHistory extends BrowserHistory {
  block: (blocker: AppHistoryBlocker) => () => void;
}

type HistoryListener = Parameters<BrowserHistory["listen"]>[0];
type HistoryUpdate = Parameters<HistoryListener>[0];

const createKey = () => Math.random().toString(36).slice(2, 10);

const toLocation = (
  history: BrowserHistory,
  to: Parameters<BrowserHistory["push"]>[0],
  state?: unknown,
): Location => {
  const url = history.createURL(to);

  return {
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    state,
    key: createKey(),
  };
};

function createBlockableBrowserHistory(): BlockableBrowserHistory {
  const baseHistory = createBrowserHistory({ v5Compat: true });
  const listeners = new Set<HistoryListener>();
  const blockers = new Set<AppHistoryBlocker>();
  let suppressNextBlock = false;
  let isRevertingPop = false;

  const notifyListeners = (update: HistoryUpdate) => {
    listeners.forEach((listener) => listener(update));
  };

  const runWithoutBlocking = (navigate: () => void) => {
    suppressNextBlock = true;
    navigate();
  };

  baseHistory.listen((update) => {
    if (isRevertingPop) {
      isRevertingPop = false;
      return;
    }

    if (suppressNextBlock) {
      suppressNextBlock = false;
      notifyListeners(update);
      return;
    }

    if (blockers.size > 0 && update.action === Action.Pop) {
      if (typeof update.delta === "number" && update.delta !== 0) {
        isRevertingPop = true;
        baseHistory.go(-update.delta);
      }

      blockers.forEach((blocker) =>
        blocker({
          action: update.action,
          location: update.location,
          retry: () => {
            const delta = update.delta;
            if (typeof delta !== "number" || delta === 0) {
              return;
            }
            runWithoutBlocking(() => baseHistory.go(delta));
          },
        }),
      );
      return;
    }

    notifyListeners(update);
  });

  return {
    get action() {
      return baseHistory.action;
    },
    get location() {
      return baseHistory.location;
    },
    createHref: baseHistory.createHref,
    createURL: baseHistory.createURL,
    encodeLocation: baseHistory.encodeLocation,
    listen(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    push(to, state) {
      if (blockers.size === 0 || suppressNextBlock) {
        suppressNextBlock = false;
        baseHistory.push(to, state);
        return;
      }

      const nextLocation = toLocation(baseHistory, to, state);
      blockers.forEach((blocker) =>
        blocker({
          action: Action.Push,
          location: nextLocation,
          retry: () => runWithoutBlocking(() => baseHistory.push(to, state)),
        }),
      );
    },
    replace(to, state) {
      if (blockers.size === 0 || suppressNextBlock) {
        suppressNextBlock = false;
        baseHistory.replace(to, state);
        return;
      }

      const nextLocation = toLocation(baseHistory, to, state);
      blockers.forEach((blocker) =>
        blocker({
          action: Action.Replace,
          location: nextLocation,
          retry: () => runWithoutBlocking(() => baseHistory.replace(to, state)),
        }),
      );
    },
    go(delta) {
      baseHistory.go(delta);
    },
    block(blocker) {
      blockers.add(blocker);
      return () => {
        blockers.delete(blocker);
      };
    },
  };
}

export const appHistory = createBlockableBrowserHistory();
