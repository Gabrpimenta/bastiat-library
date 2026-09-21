import { useState, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import { useReducedMotion } from '../services/accessibility';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export const motion = { press: 120, state: 180, enter: 220 } as const;
export const easeOut = cubicBezier(0.23, 1, 0.32, 1);

type Props = Omit<PressableProps, 'children' | 'style'> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  feedback?: 'scale' | 'highlight';
};

/** Press feedback runs on the UI thread; the action is never delayed by an animation. */
export function MotionPressable({
  children,
  style,
  feedback = 'scale',
  disabled,
  onPressIn,
  onPressOut,
  ...props
}: Props) {
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();
  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      pressRetentionOffset={16}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      style={[
        style,
        {
          opacity: disabled ? 0.45 : pressed ? 0.86 : 1,
          transform: [
            { scale: pressed && !disabled && !reduced && feedback === 'scale' ? 0.97 : 1 },
          ],
          transitionProperty: ['transform', 'opacity', 'backgroundColor', 'borderColor'],
          transitionDuration: reduced
            ? 1
            : [motion.press, motion.press, motion.state, motion.state],
          transitionTimingFunction: easeOut,
        },
      ]}
    >
      {children}
    </AnimatedPressable>
  );
}
