import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page" style={{textAlign:'center', paddingTop:'100px'}}>
          <h1 style={{color:'#f85149'}}>⚠️ Something went wrong</h1>
          <p style={{color:'#8b949e', marginTop:'10px'}}>Please refresh the page</p>
          <button
            onClick={() => window.location.reload()}
            style={{marginTop:'20px', padding:'10px 20px', background:'#e94560', color:'white', border:'none', borderRadius:'6px', cursor:'pointer'}}>
            Refresh Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;