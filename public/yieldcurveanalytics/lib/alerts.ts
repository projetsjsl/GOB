"use client"

import React from "react"

/**
 * Systeme de notifications et d'alertes pour CurveWatch
 */

export type AlertLevel = "info" | "warning" | "error" | "success"

export interface Alert {
  id: string
  level: AlertLevel
  title: string
  message: string
  timestamp: number
  duration?: number // millisecondes avant auto-dismiss
  action?: {
    label: string
    callback: () => void
  }
}

class AlertManager {
  private alerts: Map<string, Alert> = new Map()
  private listeners: Set<(alerts: Alert[]) => void> = new Set()
  private timers: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Creer une alerte
   */
  createAlert(
    title: string,
    message: string,
    level: AlertLevel = "info",
    duration?: number,
    action?: Alert["action"],
  ): string {
    const id = `alert-${Date.now()}-${Math.random()}`

    const alert: Alert = {
      id,
      title,
      message,
      level,
      timestamp: Date.now(),
      duration,
      action,
    }

    this.alerts.set(id, alert)
    this.notifyListeners()

    if (duration) {
      const timer = setTimeout(() => this.removeAlert(id), duration)
      this.timers.set(id, timer)
    }

    return id
  }

  /**
   * Raccourcis pour les types d'alertes
   */
  info(title: string, message: string, duration?: number) {
    return this.createAlert(title, message, "info", duration)
  }

  warning(title: string, message: string, duration?: number) {
    return this.createAlert(title, message, "warning", duration)
  }

  error(title: string, message: string, duration?: number) {
    return this.createAlert(title, message, "error", duration)
  }

  success(title: string, message: string, duration?: number) {
    return this.createAlert(title, message, "success", duration)
  }

  /**
   * Supprimer une alerte
   */
  removeAlert(id: string): void {
    this.alerts.delete(id)

    const timer = this.timers.get(id)
    if (timer) {
      clearTimeout(timer)
      this.timers.delete(id)
    }

    this.notifyListeners()
  }

  /**
   * Obtenir toutes les alertes
   */
  getAlerts(): Alert[] {
    return Array.from(this.alerts.values()).sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * S'abonner aux changements
   */
  subscribe(callback: (alerts: Alert[]) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Notifier tous les listeners
   */
  private notifyListeners(): void {
    const alerts = this.getAlerts()
    this.listeners.forEach((callback) => callback(alerts))
  }

  /**
   * Nettoyer toutes les alertes
   */
  clearAll(): void {
    this.timers.forEach((timer) => clearTimeout(timer))
    this.alerts.clear()
    this.timers.clear()
    this.notifyListeners()
  }
}

export const alertManager = new AlertManager()

/**
 * Hook React pour les alertes
 */
export function useAlerts() {
  const [alerts, setAlerts] = React.useState<Alert[]>([])

  React.useEffect(() => {
    const unsubscribe = alertManager.subscribe(setAlerts)
    return unsubscribe
  }, [])

  return {
    alerts,
    addAlert: (title: string, message: string, level?: AlertLevel, duration?: number) =>
      alertManager.createAlert(title, message, level, duration),
    removeAlert: (id: string) => alertManager.removeAlert(id),
    clearAll: () => alertManager.clearAll(),
  }
}
