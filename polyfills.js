// Polyfill for React Navigation web compatibility issues
if (typeof document === 'undefined') {
    global.document = {
        getElementById: () => null,
        createElement: () => ({}),
        addEventListener: () => { },
        removeEventListener: () => { },
    };
}

if (typeof window === 'undefined') {
    global.window = {
        addEventListener: () => { },
        removeEventListener: () => { },
    };
}
