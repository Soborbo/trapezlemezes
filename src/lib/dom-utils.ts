/**
 * DOM Utility Functions
 *
 * Safe DOM manipulation utilities to avoid XSS vulnerabilities.
 */

/**
 * Safely set text content of an element by ID
 * Returns the element if found, null otherwise
 */
export function setTextById(id: string, text: string): HTMLElement | null {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = text;
  }
  return element;
}

/**
 * Safely get an element by ID with null check
 */
export function getElementSafe<T extends HTMLElement = HTMLElement>(
  id: string
): T | null {
  return document.getElementById(id) as T | null;
}

/**
 * Create a text node safely (no HTML interpretation)
 */
export function createTextElement(
  tagName: string,
  text: string,
  className?: string
): HTMLElement {
  const element = document.createElement(tagName);
  element.textContent = text;
  if (className) {
    element.className = className;
  }
  return element;
}

/**
 * Create multiple lines as separate elements (safe alternative to innerHTML with <br>)
 */
export function createMultilineElement(
  lines: string[],
  containerTag = 'div',
  lineTag = 'div'
): HTMLElement {
  const container = document.createElement(containerTag);
  lines.forEach((line) => {
    const lineEl = document.createElement(lineTag);
    lineEl.textContent = line;
    container.appendChild(lineEl);
  });
  return container;
}

/**
 * Replace element content with multiple text lines (safe alternative to innerHTML)
 */
export function setMultilineContent(
  element: HTMLElement,
  lines: string[]
): void {
  // Clear existing content
  element.innerHTML = '';

  lines.forEach((line, index) => {
    if (index > 0) {
      element.appendChild(document.createElement('br'));
    }
    const textNode = document.createTextNode(line);
    element.appendChild(textNode);
  });
}

/**
 * Create a list element safely
 */
export function createListElement(
  items: string[],
  ordered = false
): HTMLUListElement | HTMLOListElement {
  const list = document.createElement(ordered ? 'ol' : 'ul') as HTMLUListElement | HTMLOListElement;
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  });
  return list;
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    console.error('JSON parse error:', e);
    return fallback;
  }
}

/**
 * Safe localStorage get with JSON parsing
 */
export function getLocalStorageJson<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return fallback;
    return JSON.parse(stored) as T;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return fallback;
  }
}

/**
 * Safe localStorage set with JSON stringify
 */
export function setLocalStorageJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Error writing ${key} to localStorage:`, e);
    return false;
  }
}
