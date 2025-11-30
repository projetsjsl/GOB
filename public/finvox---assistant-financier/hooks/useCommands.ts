import { useState, useEffect } from 'react';
import { Command } from '../types';
import { DEFAULT_COMMANDS } from '../data/defaultCommands';

export const useCommands = () => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('finvox_commands');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Basic validation to ensure it's an array
        if (Array.isArray(parsed)) {
          setCommands(parsed);
        } else {
          setCommands(DEFAULT_COMMANDS);
        }
      } catch (e) {
        console.error("Failed to parse commands from storage", e);
        setCommands(DEFAULT_COMMANDS);
      }
    } else {
      setCommands(DEFAULT_COMMANDS);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever commands change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('finvox_commands', JSON.stringify(commands));
    }
  }, [commands, isLoaded]);

  const addCommand = (cmd: Omit<Command, 'id'>) => {
    const newCommand = { ...cmd, id: Date.now().toString() };
    setCommands(prev => [newCommand, ...prev]);
  };

  const updateCommand = (id: string, updatedFields: Partial<Command>) => {
    setCommands(prev => prev.map(cmd => cmd.id === id ? { ...cmd, ...updatedFields } : cmd));
  };

  const deleteCommand = (id: string) => {
    setCommands(prev => prev.filter(cmd => cmd.id !== id));
  };

  const resetCommands = () => {
    if (window.confirm("Voulez-vous vraiment réinitialiser toutes les commandes aux valeurs par défaut ?")) {
      setCommands(DEFAULT_COMMANDS);
    }
  };

  return {
    commands,
    addCommand,
    updateCommand,
    deleteCommand,
    resetCommands
  };
};
