import { createContext } from 'react';

/**
 * Extra bottom padding a screen needs because of the tab bar around it. The tab layout that owns
 * the bar provides the value (the native bar floats over the content, the web bar does not);
 * screens outside any tab bar get 0.
 */
export const TabBarInsetContext = createContext(0);
