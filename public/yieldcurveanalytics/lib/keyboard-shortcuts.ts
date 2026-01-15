/**
 * Gestion des raccourcis clavier
 */

export type KeyboardShortcutHandler = (event: KeyboardEvent) => void

interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  handler: KeyboardShortcutHandler
  description: string
}

class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private enabled = true

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.handleKeyDown.bind(this))
    }
  }

  /**
   * Enregistrer un raccourci
   */
  register(
    key: string,
    handler: KeyboardShortcutHandler,
    description: string,
    modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean },
  ): void {
    const id = this.generateId(key, modifiers)

    this.shortcuts.set(id, {
      key,
      handler,
      description,
      ...modifiers,
    })
  }

  /**
   * Desenregistrer un raccourci
   */
  unregister(key: string, modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean }): void {
    const id = this.generateId(key, modifiers)
    this.shortcuts.delete(id)
  }

  /**
   * Gerer la pression de touche
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled) return

    for (const [, shortcut] of this.shortcuts.entries()) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
      const ctrlMatches = (event.ctrlKey || event.metaKey) === (shortcut.ctrl || false)
      const shiftMatches = event.shiftKey === (shortcut.shift || false)
      const altMatches = event.altKey === (shortcut.alt || false)

      if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
        event.preventDefault()
        shortcut.handler(event)
      }
    }
  }

  /**
   * Activer/desactiver les raccourcis
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * Obtenir tous les raccourcis
   */
  getShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * Generer un ID unique pour un raccourci
   */
  private generateId(
    key: string,
    modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean },
  ): string {
    const parts = [key]
    if (modifiers?.ctrl) parts.push("ctrl")
    if (modifiers?.shift) parts.push("shift")
    if (modifiers?.alt) parts.push("alt")
    if (modifiers?.meta) parts.push("meta")
    return parts.join("+")
  }
}

export const keyboardShortcutManager = new KeyboardShortcutManager()

// Raccourcis predefinis
export const PREDEFINED_SHORTCUTS = {
  REFRESH_DATA: { key: "r", ctrl: true, description: "Rafraichir les donnees" },
  TOGGLE_THEME: { key: "t", ctrl: true, shift: true, description: "Basculer le theme" },
  FOCUS_SEARCH: { key: "/", description: "Focus la recherche" },
  ESCAPE: { key: "Escape", description: "Fermer les modales" },
}
