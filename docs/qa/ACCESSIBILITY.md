# Accessibility observations

Measured on 21 September 2026. These checks cover selected behavior and palette pairs; they do not constitute a complete accessibility audit.

## Palette measurements

Ratios use WCAG relative luminance calculated from the actual sRGB token values. Across background, surface and elevated surfaces, the minimum measured ratios are:

| Foreground         | Lowest ratio |
| ------------------ | ------------ |
| Main text          | 12.33:1      |
| Secondary text     | 6.68:1       |
| Copper action text | 7.21:1       |
| Error text         | 7.69:1       |
| Input boundary     | 3.10:1       |

Input boundaries use a separate `#667881` control color; the darker decorative border is not used to identify those text fields. Disabled controls and decorative imagery are outside these text measurements.

## Executed and pending behavior

- iOS Simulator, largest accessibility Dynamic Type: sign-in fields accepted input through Next/Go keyboard navigation, submitted, and displayed a recoverable authentication error. Body text retains system scaling; the brand wordmark has a fixed visual size and an accessible label. Default text size was restored.
- Shared native buttons, icon buttons, chips, speed and completion controls have minimum targets of 48 points. Disabled controls expose their state. Native text fields grow with text.
- Native navigation and artwork transitions now follow the system's Reduce Motion setting, including changes while the app runs. Web CSS already disables transitions, shimmer and smooth scrolling for reduced motion. The Android Release app remained operable for playback, seeking and saved-item toggles with system reduced motion enabled; the original setting was restored. Browser computed styles confirmed zero-duration transitions and no button scale under reduced motion. Screen-reader traversal remains pending manual validation.
- VoiceOver, TalkBack and a complete focus-order audit are not marked passed.
