/**
 * React Grid Layout Bridge
 * Exposes react-grid-layout v2.x globally for Babel-transpiled scripts
 * Migration from CDN (v1.4.4) to npm package (v2.1.1)
 *
 * NOTE: Custom WidthProvider using window.React to avoid hook context issues
 */

// Import ALL exports from react-grid-layout
import * as RGL from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

/**
 * Custom WidthProvider HOC that uses window.React
 * This avoids issues with React hooks from bundled vs CDN React
 */
function WidthProvider(ComposedComponent) {
  const React = window.React;

  class WidthProviderClass extends React.Component {
    constructor(props) {
      super(props);
      this.state = { width: 1200 };
      this.containerRef = React.createRef();
      this.mounted = false;
    }

    componentDidMount() {
      this.mounted = true;
      this.updateWidth();
      window.addEventListener('resize', this.updateWidth);
    }

    componentWillUnmount() {
      this.mounted = false;
      window.removeEventListener('resize', this.updateWidth);
    }

    updateWidth = () => {
      if (this.mounted && this.containerRef.current) {
        const width = this.containerRef.current.offsetWidth;
        if (width !== this.state.width) {
          this.setState({ width });
        }
      }
    }

    render() {
      const { measureBeforeMount, className, style, ...rest } = this.props;

      if (measureBeforeMount && !this.mounted) {
        return React.createElement('div', {
          ref: this.containerRef,
          style: { ...style, width: '100%' },
          className: className
        });
      }

      return React.createElement('div', {
        ref: this.containerRef,
        style: { ...style, width: '100%' },
        className: className
      },
        React.createElement(ComposedComponent, {
          ...rest,
          width: this.state.width
        })
      );
    }
  }

  WidthProviderClass.defaultProps = {
    measureBeforeMount: false
  };

  WidthProviderClass.displayName = `WidthProvider(${ComposedComponent.displayName || ComposedComponent.name || 'Component'})`;

  return WidthProviderClass;
}

// Build export object with custom WidthProvider
const RGLExports = {
  ...RGL,
  WidthProvider  // Override with our class-based version
};

// Log successful initialization
console.log(' React Grid Layout v2.1.1 loaded with custom WidthProvider');

// Export the module object
export default RGLExports;
