import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Utility function to validate conversation ID format
export function isValidConversationId(conversationId: string): boolean {
  return /^conv_[a-zA-Z0-9]+$/.test(conversationId);
}