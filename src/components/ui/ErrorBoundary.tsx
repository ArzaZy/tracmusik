import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError:    boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console only — no sensitive info exposed
    console.error('[TracMusic] Unhandled render error:', error.message);
  }

  reset = () => this.setState({ hasError: false, errorMessage: '' });

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message} numberOfLines={3}>
            {this.props.fallbackMessage ?? this.state.errorMessage}
          </Text>
          <Pressable onPress={this.reset} style={styles.btn}>
            <Text style={styles.btnText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#0D0D1A',
  },
  emoji:    { fontSize: 48, marginBottom: 16 },
  title:    { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
  message:  { fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  btn:      { backgroundColor: '#7035E0', paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
  btnText:  { color: '#fff', fontWeight: '700', fontSize: 15 },
});
