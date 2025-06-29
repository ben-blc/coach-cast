// Global type definitions

// Add Daily.js type definitions
interface Window {
  Daily?: {
    createFrame: (container?: HTMLElement | null, options?: any) => {
      join: (options: { url: string }) => void;
      leave: () => void;
    };
  };
}