import { render } from '@testing-library/react';
import { useTheme } from '../contexts/ThemeContext';

function ThemeConsumer() {
  useTheme();
  return <div>theme</div>;
}

describe('ThemeContext', () => {
  it('throws when useTheme is rendered outside its provider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<ThemeConsumer />)).toThrow('useTheme must be used within a ThemeProvider');

    consoleError.mockRestore();
  });
});
