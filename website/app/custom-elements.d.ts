import type { HTMLAttributes } from 'react';

type CE = HTMLAttributes<HTMLElement> & { key?: React.Key | null };

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      // Hero
      'hero-section': CE;
      'hero-content': CE;
      'hero-logo': CE;
      'hero-title': CE;
      'hero-subtitle': CE;
      'hero-description': CE;
      'hero-actions': CE;

      // Section headers
      'section-header': CE;
      'section-label': CE;
      'section-title': CE;
      'section-description': CE;

      // Quickstart
      'quickstart-section': CE;
      'install-command': CE;

      // Features
      'features-section': CE;
      'feature-grid': CE;
      'feature-card': CE;
      'feature-icon': CE;
      'feature-title': CE;
      'feature-desc': CE;

      // Integrations
      'integrations-section': CE;
      'integrations-track': CE;
      'integration-item': CE;
      'integration-icon': CE;
      'integration-name': CE;

      // Benefits
      'benefits-section': CE;
      'benefit-grid': CE;
      'benefit-card': CE;
      'benefit-icon': CE;

      // Use cases
      'usecases-section': CE;
      'usecase-grid': CE;
      'usecase-card': CE;
      'usecase-badge': CE;

      // Playground
      'playground-layout': CE;
      'playground-config': CE;
      'playground-console': CE;
      'console-output': CE;
      'console-line': CE;
      'console-spinner': CE;

      // Config
      'config-group': CE;
      'config-label': CE;

      // Integration picker
      'integration-picker': CE;
      'integration-list': CE;
      'integration-option': CE;
      'integration-details': CE;

      // Code view
      'code-view': CE;
      'code-block': CE;
      'code-tabs': CE;

      // Site structure
      'site-header': CE;
      'site-nav': CE;
      'site-footer': CE;
    }
  }
}
