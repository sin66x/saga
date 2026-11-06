/** Alert dialogs (the browser's own confirm/alert boxes). */
export interface AlertButton {
  text?: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

/**
 * Shows a message. With buttons, it asks OK/Cancel and runs the first non-cancel button on OK.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  const text = message ? `${title}\n\n${message}` : title;
  const actions = (buttons ?? []).filter((b) => b.style !== 'cancel');
  if (actions.length === 0) {
    window.alert(text);
    return;
  }
  if (window.confirm(text)) actions[0].onPress?.();
}
