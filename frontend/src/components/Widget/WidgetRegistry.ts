import { WidgetConfig } from './WidgetContainer';

// Widget registry for managing all third-party widgets
export class WidgetRegistry {
  private static instance: WidgetRegistry;
  private widgets: Map<string, WidgetConfig> = new Map();
  private loadedScripts: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): WidgetRegistry {
    if (!WidgetRegistry.instance) {
      WidgetRegistry.instance = new WidgetRegistry();
    }
    return WidgetRegistry.instance;
  }

  // Register a new widget configuration
  public register(config: WidgetConfig): void {
    // Validate widget configuration
    this.validateConfig(config);
    
    this.widgets.set(config.id, config);
    console.log(`Widget registered: ${config.id} (${config.type})`);
  }

  // Get widget configuration by ID
  public get(id: string): WidgetConfig | undefined {
    return this.widgets.get(id);
  }

  // Get all registered widgets
  public getAll(): WidgetConfig[] {
    return Array.from(this.widgets.values());
  }

  // Get widgets by type
  public getByType(type: WidgetConfig['type']): WidgetConfig[] {
    return Array.from(this.widgets.values()).filter(widget => widget.type === type);
  }

  // Unregister a widget
  public unregister(id: string): boolean {
    return this.widgets.delete(id);
  }

  // Load script for script-type widgets
  public async loadScript(url: string): Promise<void> {
    if (this.loadedScripts.has(url)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        this.loadedScripts.add(url);
        resolve();
      };
      
      script.onerror = () => {
        reject(new Error(`Failed to load script: ${url}`));
      };
      
      document.head.appendChild(script);
    });
  }

  // Validate widget configuration
  private validateConfig(config: WidgetConfig): void {
    if (!config.id) {
      throw new Error('Widget ID is required');
    }
    
    if (!config.name) {
      throw new Error('Widget name is required');
    }
    
    if (!['iframe', 'script', 'component'].includes(config.type)) {
      throw new Error('Invalid widget type');
    }
    
    if (config.type === 'iframe' && !config.src) {
      throw new Error('Iframe widgets require a src URL');
    }
    
    if (config.type === 'script' && !config.scriptUrl) {
      throw new Error('Script widgets require a scriptUrl');
    }
    
    if (config.type === 'component' && !config.component) {
      throw new Error('Component widgets require a component');
    }
    
    if (!config.security || !config.security.allowedOrigins) {
      throw new Error('Widget security configuration is required');
    }
  }
}

// Pre-configured widgets for common services
export const WIDGET_CONFIGS: Record<string, WidgetConfig> = {
  ELEVENLABS_CONVAI: {
    id: 'elevenlabs-convai',
    name: 'ElevenLabs ConvAI',
    type: 'script',
    scriptUrl: 'https://unpkg.com/@elevenlabs/convai-widget-embed',
    security: {
      allowedOrigins: ['https://elevenlabs.io', 'https://api.elevenlabs.io'],
      sandboxRules: ['allow-scripts', 'allow-same-origin', 'allow-microphone']
    },
    loading: {
      showLoader: true,
      timeout: 10000,
      retryCount: 2
    },
    dimensions: {
      width: '100%',
      height: 400
    },
    lazyLoad: true
  },

  HEYGEN_AVATAR: {
    id: 'heygen-avatar',
    name: 'HeyGen AI Avatar',
    type: 'iframe',
    security: {
      allowedOrigins: ['https://app.heygen.com', 'https://heygen.com'],
      sandboxRules: ['allow-scripts', 'allow-same-origin', 'allow-presentation']
    },
    loading: {
      showLoader: true,
      timeout: 15000,
      retryCount: 3
    },
    dimensions: {
      width: '100%',
      height: 500
    },
    responsive: true,
    lazyLoad: true
  },

  CALENDLY: {
    id: 'calendly',
    name: 'Calendly Booking',
    type: 'iframe',
    security: {
      allowedOrigins: ['https://calendly.com', 'https://assets.calendly.com'],
      sandboxRules: ['allow-scripts', 'allow-same-origin', 'allow-forms']
    },
    loading: {
      showLoader: true,
      timeout: 12000,
      retryCount: 2
    },
    dimensions: {
      width: '100%',
      height: 700
    },
    responsive: true,
    lazyLoad: true
  },

  TYPEFORM: {
    id: 'typeform',
    name: 'Typeform Survey',
    type: 'iframe',
    security: {
      allowedOrigins: ['https://form.typeform.com', 'https://typeform.com'],
      sandboxRules: ['allow-scripts', 'allow-same-origin', 'allow-forms']
    },
    loading: {
      showLoader: true,
      timeout: 10000,
      retryCount: 2
    },
    dimensions: {
      width: '100%',
      height: 600
    },
    responsive: true,
    lazyLoad: true
  },

  HUBSPOT_CHAT: {
    id: 'hubspot-chat',
    name: 'HubSpot Chat',
    type: 'script',
    scriptUrl: 'https://js.hs-scripts.com/YOUR_PORTAL_ID.js',
    security: {
      allowedOrigins: ['https://api.hubspot.com', 'https://js.hs-scripts.com'],
      sandboxRules: ['allow-scripts', 'allow-same-origin']
    },
    loading: {
      showLoader: false,
      timeout: 8000,
      retryCount: 2
    },
    lazyLoad: false
  },

  INTERCOM: {
    id: 'intercom',
    name: 'Intercom Chat',
    type: 'script',
    scriptUrl: 'https://widget.intercom.io/widget/YOUR_APP_ID',
    security: {
      allowedOrigins: ['https://widget.intercom.io', 'https://api-iam.intercom.io'],
      sandboxRules: ['allow-scripts', 'allow-same-origin']
    },
    loading: {
      showLoader: false,
      timeout: 8000,
      retryCount: 2
    },
    lazyLoad: false
  }
};

// Initialize registry with default widgets
const registry = WidgetRegistry.getInstance();
Object.values(WIDGET_CONFIGS).forEach(config => {
  registry.register(config);
});

export default registry;