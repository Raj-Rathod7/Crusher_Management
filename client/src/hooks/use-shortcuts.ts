import { useEffect, useMemo } from "react";

export interface Keybind {
  keys: string; // e.g. "ctrl+k", "meta+shift+p", "/", "alt+s"
  action: () => void | Promise<void>;
}

export const useShortcuts = ({ keybinds }: { keybinds: Keybind[] }) => {
  // 1. Build a normalized lookup map
  const shortcutMap = useMemo(() => {
    const map = new Map<string, () => void | Promise<void>>();

    keybinds.forEach(({ keys, action }) => {
      const normalizedKey = keys
        .toLowerCase()
        .split("+")
        .map((k) => k.trim())
        .sort() // Sorting guarantees modifier order doesn't break matching
        .join("+");

      map.set(normalizedKey, action);
    });

    return map;
  }, [keybinds]);

  useEffect(() => {
    const handleKeyEvents = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;

      // 2. Prevent triggering while typing
      const isTyping =
        target &&
        (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
          target.isContentEditable);

      if (isTyping) return;

      // 3. Build active modifiers list
      const parts: string[] = [];

      if (event.ctrlKey) parts.push("ctrl");
      if (event.metaKey) parts.push("cmd"); // macOS Command Key
      if (event.altKey) parts.push("alt");
      if (event.shiftKey) parts.push("shift");

      // 4. Ignore standalone modifier keypresses (e.g. just pressing 'Control')
      const mainKey = event.key.toLowerCase();
      if (["control", "meta", "alt", "shift"].includes(mainKey)) {
        return;
      }

      // 5. Add the actual key and sort to match `shortcutMap` format
      parts.push(mainKey === " " ? "space" : mainKey);
      const pressedCombo = parts.sort().join("+");

      const action = shortcutMap.get(pressedCombo);

      if (action) {
        event.preventDefault();
        event.stopImmediatePropagation();
        action();
      }
    };

    // 6. Use capture phase (`true`) to override browser defaults
    window.addEventListener("keydown", handleKeyEvents, true);
    return () => {
      window.removeEventListener("keydown", handleKeyEvents, true);
    };
  }, [shortcutMap]); // Include shortcutMap to prevent stale closures
};