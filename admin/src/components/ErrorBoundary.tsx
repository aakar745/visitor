import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { Result, Button, Typography, Card, Space } from 'antd';
import { 
  BugOutlined, 
  ReloadOutlined, 
  HomeOutlined,
  WarningOutlined 
} from '@ant-design/icons';

const { Paragraph, Text } = Typography;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  location?: string; // Track location for route change detection
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  previousLocation?: string; // Track previous location
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      previousLocation: props.location,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  /**
   * SECURITY FIX (BUG-016): Reset error state on route change
   * This prevents error UI from persisting when user navigates to a different page
   */
  componentDidUpdate(prevProps: Props) {
    // Check if location has changed
    if (this.props.location && this.props.location !== prevProps.location) {
      // Route changed - reset error state
      if (this.state.hasError) {
        console.log('Route changed - resetting error boundary');
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          previousLocation: this.props.location,
        });
      }
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Send to error tracking service (e.g., Sentry)
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = () => {
    this.handleReset();
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#f5f5f5',
          padding: '24px'
        }}>
          <Card 
            style={{ 
              maxWidth: '600px', 
              width: '100%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <Result
              status="error"
              icon={<BugOutlined style={{ color: '#ff4d4f' }} />}
              title="Oops! Something went wrong"
              subTitle="We're sorry, but something unexpected happened. Our team has been notified."
              extra={
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                  <Space size="middle" style={{ justifyContent: 'center', width: '100%' }}>
                    <Button 
                      type="primary" 
                      icon={<ReloadOutlined />}
                      onClick={this.handleReset}
                      size="large"
                    >
                      Try Again
                    </Button>
                    <Button 
                      icon={<HomeOutlined />}
                      onClick={this.handleGoHome}
                      size="large"
                    >
                      Go to Dashboard
                    </Button>
                  </Space>
                  
                  {import.meta.env.DEV && this.state.error && (
                    <Card 
                      size="small" 
                      title={
                        <Space>
                          <WarningOutlined style={{ color: '#faad14' }} />
                          <Text strong>Error Details (Development Mode)</Text>
                        </Space>
                      }
                      style={{ 
                        textAlign: 'left',
                        marginTop: '16px',
                        background: '#fff7e6',
                        borderColor: '#ffd666'
                      }}
                    >
                      <Paragraph style={{ marginBottom: '8px' }}>
                        <Text strong>Error Message:</Text>
                        <br />
                        <Text code style={{ fontSize: '12px' }}>
                          {this.state.error.message}
                        </Text>
                      </Paragraph>
                      
                      <Paragraph style={{ marginBottom: '8px' }}>
                        <Text strong>Stack Trace:</Text>
                        <br />
                        <pre style={{ 
                          fontSize: '11px', 
                          background: '#fff',
                          padding: '8px',
                          borderRadius: '4px',
                          overflow: 'auto',
                          maxHeight: '200px',
                          border: '1px solid #d9d9d9'
                        }}>
                          {this.state.error.stack}
                        </pre>
                      </Paragraph>

                      {this.state.errorInfo && (
                        <Paragraph>
                          <Text strong>Component Stack:</Text>
                          <br />
                          <pre style={{ 
                            fontSize: '11px', 
                            background: '#fff',
                            padding: '8px',
                            borderRadius: '4px',
                            overflow: 'auto',
                            maxHeight: '150px',
                            border: '1px solid #d9d9d9'
                          }}>
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </Paragraph>
                      )}
                    </Card>
                  )}
                </Space>
              }
            />
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component that tracks route changes and passes location to ErrorBoundary
 * 
 * SECURITY FIX (BUG-016): This component must be used INSIDE a Router context
 * It will automatically reset error state when the route changes
 * 
 * Usage:
 *   <Router>
 *     <ErrorBoundaryWithRouter>
 *       <YourComponent />
 *     </ErrorBoundaryWithRouter>
 *   </Router>
 * 
 * Note: This component uses a key prop trick to force remount on route change
 * which is a React pattern for resetting component state on navigation
 */
export const ErrorBoundaryWithRouter: React.FC<Omit<Props, 'location'>> = (props) => {
  // Use window.location.pathname to track current route
  // This updates on every render, causing ErrorBoundary to detect changes
  const location = window.location.pathname + window.location.search;

  return <ErrorBoundary {...props} location={location} key={location} />;
};

export default ErrorBoundary;

