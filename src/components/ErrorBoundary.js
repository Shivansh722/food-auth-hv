import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          fontFamily: 'Arial, sans-serif',
          maxWidth: '600px',
          margin: '50px auto',
          border: '1px solid #ddd',
          borderRadius: '8px'
        }}>
          <h1 style={{ color: '#d32f2f' }}>🚨 Application Error</h1>
          <p style={{ color: '#666' }}>Something went wrong. Please try refreshing the page.</p>
          
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Error Details (click to expand)
            </summary>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '12px',
              marginTop: '10px'
            }}>
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo.componentStack}
            </pre>
          </details>

          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#212529',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;