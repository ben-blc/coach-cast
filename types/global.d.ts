// Global type definitions

// Add Daily.js type definitions
interface Window {
  Daily?: {
    createFrame: (container?: HTMLElement, options?: any) => {
      join: (options: { url: string }) => void;
      leave: () => void;
    };
  };
}