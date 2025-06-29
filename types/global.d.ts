// Global type definitions

// Add Daily.js type definitions
interface Window {
  Daily?: {
    createFrame: (container?: HTMLElement | null | string, options?: any) => {
      join: (options: { url: string }) => void;
      leave: () => void;
    };
    createCallObject: (options?: any) => {
      join: (options: { url: string }) => void;
      leave: () => void;
      participants: () => Record<string, any>;
      on: (event: string, callback: Function) => void;
      off: (event: string, callback: Function) => void;
    };
  };
  _dailyCallObject?: any;
}