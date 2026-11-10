// A test-only tag verifies activation, not the third-party component's behavior.
if (!customElements.get('hex-color-picker')) customElements.define('hex-color-picker', class extends HTMLElement {});
