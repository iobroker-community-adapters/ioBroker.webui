# ioBroker Adapter Development with GitHub Copilot

**Version:** 0.4.0
**Template Source:** https://github.com/DrozmotiX/ioBroker-Copilot-Instructions

This file contains instructions and best practices for GitHub Copilot when working on ioBroker adapter development.

## Project Context

You are working on an ioBroker adapter. ioBroker is an integration platform for the Internet of Things, focused on building smart home and industrial IoT solutions. Adapters are plugins that connect ioBroker to external systems, devices, or services.

### Adapter-Specific Context
- **Adapter Name**: webui
- **Primary Function**: Complete visualization system for ioBroker with graphical user interface using webcomponents
- **Key Technologies**: TypeScript, Web Components, Monaco Editor, Blockly, Gulp build system
- **Main Features**: 
  - Simple scripting language
  - Binding to ioBroker objects with converters & JavaScript expressions
  - Drag & drop functionality (images, objects)
  - Split view editing (layout and HTML code)
  - Global stylesheet support
  - NPM package support for webcomponents
  - Screens within screens capability
- **Dependencies**: @iobroker/adapter-core, Web adapter, numerous frontend libraries
- **Build Process**: TypeScript compilation, Gulp tasks, ESBuild bundling
- **Frontend Architecture**: Web Components based with custom designer tools

## Testing

### Unit Testing
- Use Jest as the primary testing framework for ioBroker adapters
- Create tests for all adapter main functions and helper methods
- Test error handling scenarios and edge cases
- Mock external API calls and hardware dependencies
- For adapters connecting to APIs/devices not reachable by internet, provide example data files to allow testing of functionality without live connections
- Example test structure:
  ```javascript
  describe('AdapterName', () => {
    let adapter;
    
    beforeEach(() => {
      // Setup test adapter instance
    });
    
    test('should initialize correctly', () => {
      // Test adapter initialization
    });
  });
  ```

### Integration Testing

**IMPORTANT**: Use the official `@iobroker/testing` framework for all integration tests. This is the ONLY correct way to test ioBroker adapters.

**Official Documentation**: https://github.com/ioBroker/testing

#### Framework Structure
Integration tests MUST follow this exact pattern:

```javascript
const path = require('path');
const { tests } = require('@iobroker/testing');

// Define test coordinates or configuration
const TEST_COORDINATES = '52.520008,13.404954'; // Berlin
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// Use tests.integration() with defineAdditionalTests
tests.integration(path.join(__dirname, '..'), {
    defineAdditionalTests({ suite }) {
        suite('Test adapter with specific configuration', (getHarness) => {
            let harness;

            before(() => {
                harness = getHarness();
            });

            it('should configure and start adapter', function () {
                return new Promise(async (resolve, reject) => {
                    try {
                        harness = getHarness();
                        
                        // Get adapter object using promisified pattern
                        const obj = await new Promise((res, rej) => {
                            harness.objects.getObject('system.adapter.your-adapter.0', (err, o) => {
                                if (err) return rej(err);
                                res(o);
                            });
                        });
                        
                        if (!obj) {
                            return reject(new Error('Adapter object not found'));
                        }

                        // Configure adapter properties
                        Object.assign(obj.native, {
                            position: TEST_COORDINATES,
                            createCurrently: true,
                            createHourly: true,
                            createDaily: true,
                            // Add other configuration as needed
                        });

                        // Set the updated configuration
                        harness.objects.setObject(obj._id, obj);

                        console.log('✅ Step 1: Configuration written, starting adapter...');
                        
                        // Start adapter and wait
                        await harness.startAdapterAndWait();
                        
                        console.log('✅ Step 2: Adapter started');

                        // Wait for adapter to process data
                        const waitMs = 15000;
                        await wait(waitMs);

                        console.log('🔍 Step 3: Checking states after adapter run...');
                        
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                });
            });
        });
    }
});
```

#### Test Execution Best Practices
1. **Use Proper Timeouts**: Set appropriate timeouts for integration tests (30-60 seconds minimum for complex adapters)
2. **Wait for Completion**: Always wait for the adapter to complete its initialization and first data fetch
3. **Check Results**: Verify that expected states/objects are created
4. **Cleanup**: Ensure tests don't interfere with each other

#### Testing WebUI Specific Functionality
For webui adapter testing, focus on:
- **File Service Tests**: Test file upload/download operations
- **Socket Communication**: Test WebSocket connections between frontend and backend
- **Widget Loading**: Test npm package widget loading functionality
- **Screen Management**: Test screen creation, modification, and deletion
- **Binding Engine**: Test object binding and converter functionality

## Logging and Error Handling

### Logging Guidelines
- Use appropriate logging levels:
  - `error`: Critical issues that prevent adapter operation
  - `warn`: Important issues that don't stop operation but need attention
  - `info`: General operational information
  - `debug`: Detailed diagnostic information
- Include relevant context in log messages
- Use structured logging for complex data

### Error Handling
- Always catch and handle exceptions gracefully
- Provide meaningful error messages to users
- Implement proper fallback mechanisms
- Clean up resources in error scenarios

### Example Logging
```javascript
try {
    await this.performOperation();
    this.log.info('Operation completed successfully');
} catch (error) {
    this.log.error(`Operation failed: ${error.message}`);
    // Handle error appropriately
}
```

## WebUI Adapter Specific Patterns

### Frontend Development
When working with the webui adapter frontend code:

#### Web Components
- Use TypeScript for all component development
- Follow custom element naming conventions (kebab-case)
- Implement proper lifecycle methods (connectedCallback, disconnectedCallback)
- Use shadow DOM for style encapsulation

```typescript
export class CustomWebUIElement extends BaseCustomWebcomponent {
    static override readonly style = css`
        /* Component styles */
    `;

    connectedCallback() {
        super.connectedCallback();
        this.initializeComponent();
    }
}
```

#### Designer Integration
- Register components with the webui designer
- Provide property definitions for design-time editing
- Implement proper drag-and-drop support
- Support property grid integration

#### Build System
- Use the provided Gulp tasks for building
- Follow TypeScript configuration in tsconfig.json
- Use ESBuild for bundling when needed
- Generate reflection files for script commands and properties

### Backend Development
When working with the webui adapter backend:

#### File Operations
- Use proper async/await patterns for file I/O
- Implement secure file upload/download handling
- Validate file types and sizes
- Clean up temporary files

#### Socket Communication
- Handle WebSocket connections properly
- Implement message routing between clients
- Maintain client state and cleanup on disconnect
- Use proper error handling for network operations

#### NPM Package Management
- Validate package installations
- Handle package dependencies correctly
- Implement proper cleanup on package removal
- Monitor package installation status

## ioBroker Adapter Core Patterns

### Adapter Lifecycle
```javascript
class YourAdapter extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: 'your-adapter',
        });
        
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    async onReady() {
        // Initialize adapter
        this.setState('info.connection', false, true);
        
        try {
            await this.initialize();
            this.setState('info.connection', true, true);
        } catch (error) {
            this.log.error(`Initialization failed: ${error.message}`);
        }
    }

    onStateChange(id, state) {
        if (state && !state.ack) {
            // Handle state changes from ioBroker
        }
    }

    onUnload(callback) {
        try {
            // Clean up resources
            this.clearIntervals();
            this.closeConnections();
            this.setState('info.connection', false, true);
            
            callback();
        } catch (e) {
            callback();
        }
    }
}
```

### State Management
- Always set the connection state (`info.connection`)
- Use appropriate state types and roles
- Implement proper acknowledgment handling
- Create states with proper definitions

### Configuration Handling
- Validate configuration on startup
- Provide sensible defaults
- Handle configuration changes appropriately
- Encrypt sensitive data (passwords, tokens)

## Build and Development

### TypeScript Configuration
- Follow the existing tsconfig.json settings
- Use strict type checking
- Implement proper type definitions
- Use ES modules where appropriate

### Gulp Build Process
The webui adapter uses a complex Gulp-based build system:
- **delAll**: Cleans build directories
- **typescript compilation**: Compiles TS to JS
- **reflection generation**: Creates property and command definitions
- **asset processing**: Handles frontend assets

### Development Workflow
1. Make changes to TypeScript source files
2. Run `npm run build` to compile and build
3. Use `npm run check` for type checking without build
4. Test changes with `npm test`
5. Use development server for frontend testing

## Code Style and Standards

- Follow JavaScript/TypeScript best practices
- Use async/await for asynchronous operations
- Implement proper resource cleanup in `unload()` method
- Use semantic versioning for adapter releases
- Include proper JSDoc comments for public methods
- For webui adapter: Follow the existing code structure and naming conventions
- Use consistent indentation and formatting
- Implement proper error boundaries in components

## CI/CD and Testing Integration

### GitHub Actions for API Testing
For adapters with external API dependencies, implement separate CI/CD jobs:

```yaml
# Tests API connectivity with demo credentials (runs separately)
demo-api-tests:
  if: contains(github.event.head_commit.message, '[skip ci]') == false
  
  runs-on: ubuntu-22.04
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Use Node.js 20.x
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run demo API tests
      run: npm run test:integration-demo
```

### CI/CD Best Practices
- Run credential tests separately from main test suite
- Use ubuntu-22.04 for consistency
- Don't make credential tests required for deployment
- Provide clear failure messages for API connectivity issues
- Use appropriate timeouts for external API calls (120+ seconds)

### Package.json Script Integration
Add dedicated script for credential testing:
```json
{
  "scripts": {
    "test:integration-demo": "mocha test/integration-demo --exit"
  }
}
```

### WebUI Specific Testing
For the webui adapter, focus testing on:
- **Frontend Components**: Test web components individually
- **Designer Functionality**: Test drag-and-drop, property editing
- **Build Process**: Ensure build artifacts are generated correctly
- **Socket Communication**: Test real-time communication features
- **File Operations**: Test file upload/download functionality

## Security Considerations

### Frontend Security
- Sanitize user inputs in web components
- Use proper Content Security Policy
- Validate uploaded files thoroughly
- Implement proper access controls

### Backend Security
- Validate all API inputs
- Use secure file handling practices
- Implement proper authentication/authorization
- Sanitize database queries if applicable

### NPM Package Security
- Validate npm packages before installation
- Monitor for security vulnerabilities
- Implement sandboxing where possible
- Audit package dependencies regularly