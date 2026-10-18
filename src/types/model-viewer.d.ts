import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          poster?: string;
          'auto-rotate'?: boolean | string;
          'camera-controls'?: boolean | string;
          'shadow-intensity'?: string | number;
          'environment-image'?: string;
          'interaction-prompt'?: string;
          ar?: boolean | string;
          'ar-modes'?: string;
          exposure?: string | number;
        },
        HTMLElement
      >;
    }
  }
}
