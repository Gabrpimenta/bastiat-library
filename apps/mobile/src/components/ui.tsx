import {
  Text,
  View,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  type TextProps,
  type StyleProp,
} from 'react-native';
import { Image, type ImageStyle } from 'expo-image';
import { router } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  Search,
  UserRound,
} from 'lucide-react-native';
import { colors as c } from '@bastiat/design-tokens';
import { contentLabel, type Content } from '@bastiat/contracts';
import { useLibrary } from '../services/library';
import { cacheContent } from '../services/api';
import { useReducedMotion } from '../services/accessibility';

export const type = {
  body: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  bold: 'DMSans_600SemiBold',
  display: 'Lora_400Regular',
  displayMedium: 'Lora_500Medium',
};
export function Txt({ style, ...props }: TextProps) {
  return <Text {...props} style={[s.text, style]} />;
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Txt style={s.eyebrow}>{children}</Txt>;
}
export function Title({ children, small = false }: { children: React.ReactNode; small?: boolean }) {
  return (
    <Txt accessibilityRole="header" style={[s.title, small && { fontSize: 29, lineHeight: 38 }]}>
      {children}
    </Txt>
  );
}
export function Button({
  children,
  onPress,
  secondary = false,
  disabled = false,
  testID,
}: {
  children: React.ReactNode;
  onPress(): void;
  secondary?: boolean;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.buttonSecondary,
        { opacity: pressed || disabled ? 0.55 : 1 },
      ]}
    >
      <Txt style={[s.buttonText, secondary && { color: c.text }]}>{children}</Txt>
    </Pressable>
  );
}
export function IconButton({
  children,
  label,
  onPress,
  disabled = false,
}: {
  children: React.ReactNode;
  label: string;
  onPress(): void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[s.iconButton, disabled && { opacity: 0.4 }]}
    >
      {children}
    </Pressable>
  );
}
export function Header() {
  return (
    <View style={s.header}>
      <Pressable
        onPress={() => router.navigate('/(tabs)')}
        accessibilityRole="button"
        accessibilityLabel="Bastiat Library home"
        style={s.brand}
      >
        <BookOpen size={28} color={c.copper} strokeWidth={1.4} />
        <View>
          <Txt allowFontScaling={false} style={s.brandName}>
            Bastiat
          </Txt>
          <Txt allowFontScaling={false} style={s.brandSub}>
            LIBRARY
          </Txt>
        </View>
      </Pressable>
      <View style={s.row}>
        <IconButton label="Search the library" onPress={() => router.navigate('/(tabs)/explore')}>
          <Search size={22} color={c.text} strokeWidth={1.6} />
        </IconButton>
        <IconButton label="Open profile" onPress={() => router.navigate('/(tabs)/profile')}>
          <UserRound size={21} color={c.text} strokeWidth={1.6} />
        </IconButton>
      </View>
    </View>
  );
}
export function BackBar({ label = 'The collection' }: { label?: string }) {
  return (
    <View style={s.backBar}>
      <Pressable
        style={s.backButton}
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={21} color={c.text} />
        <Txt style={{ color: c.muted, fontSize: 13 }}>{label}</Txt>
      </Pressable>
    </View>
  );
}
// Metro requires static require calls to bundle native image assets.
/* eslint-disable @typescript-eslint/no-require-imports */
const artwork: Record<string, number> = {
  window: require('../../assets/window.webp'),
  law: require('../../assets/law.webp'),
  trade: require('../../assets/trade.webp'),
  choice: require('../../assets/choice.webp'),
};
/* eslint-enable @typescript-eslint/no-require-imports */
export function Artwork({ uri, style }: { uri: string; style?: StyleProp<ImageStyle> }) {
  const reducedMotion = useReducedMotion();
  const key = uri.split('/').pop()?.split('.')[0] ?? '';
  return (
    <Image
      accessibilityElementsHidden
      importantForAccessibility="no"
      source={artwork[key] ?? { uri }}
      style={[{ width: '100%', aspectRatio: 1.65, backgroundColor: c.elevated }, style]}
      contentFit="cover"
      transition={reducedMotion ? 0 : 180}
    />
  );
}
export function SaveButton({ item }: { item: Content }) {
  const lib = useLibrary();
  const saved = lib.isSaved(item);
  return (
    <Pressable
      onPress={() => {
        cacheContent(item);
        lib.toggleBookmark(item);
      }}
      style={s.iconButton}
      accessibilityRole="button"
      accessibilityLabel={`${saved ? 'Unsave' : 'Save'} ${item.title}`}
      accessibilityState={{ selected: saved }}
    >
      {saved ? (
        <Check size={21} color={c.copper} />
      ) : (
        <Bookmark size={21} color={c.muted} strokeWidth={1.5} />
      )}
    </Pressable>
  );
}
export function openContent(item: Content) {
  cacheContent(item);
  if (item.kind === 'course')
    router.push({ pathname: '/course/[slug]', params: { slug: item.slug } });
  if (item.kind === 'lesson')
    router.push({ pathname: '/lesson/[slug]', params: { slug: item.slug } });
  if (item.kind === 'article')
    router.push({ pathname: '/reading/[slug]', params: { slug: item.slug } });
}
export function ContentCard({ item, horizontal = false }: { item: Content; horizontal?: boolean }) {
  return (
    <View style={[s.card, horizontal && { width: 280 }]}>
      <Pressable
        onPress={() => openContent(item)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
      >
        <View style={{ overflow: 'hidden', borderRadius: 8 }}>
          <Artwork uri={item.coverUrl} />
          <View style={s.artBadge}>
            <Txt style={s.artBadgeText}>
              {item.kind === 'article'
                ? 'READING'
                : item.kind === 'course'
                  ? 'COURSE'
                  : item.format.toUpperCase()}
            </Txt>
          </View>
        </View>
        <View style={{ paddingTop: 17 }}>
          <Eyebrow>{item.topic}</Eyebrow>
          <Txt style={s.cardTitle}>{item.title}</Txt>
          <Txt style={s.description} numberOfLines={horizontal ? 2 : undefined}>
            {item.description}
          </Txt>
        </View>
      </Pressable>
      <View style={s.cardMeta}>
        <Txt style={{ fontSize: 12, color: c.muted }}>{contentLabel(item)}</Txt>
        <SaveButton item={item} />
      </View>
    </View>
  );
}
export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: () => void;
}) {
  return (
    <View style={s.sectionHeading}>
      <View style={{ flex: 1 }}>
        <Txt accessibilityRole="header" style={s.sectionTitle}>
          {title}
        </Txt>
        {subtitle && <Txt style={s.description}>{subtitle}</Txt>}
      </View>
      {action && (
        <IconButton label="Explore all content" onPress={action}>
          <ArrowRight size={22} color={c.copper} />
        </IconButton>
      )}
    </View>
  );
}
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress(): void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[s.chip, selected && s.chipSelected]}
    >
      <Txt style={{ fontSize: 13, color: selected ? c.copper : c.muted }}>{label}</Txt>
    </Pressable>
  );
}
export function Chips({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingVertical: 8 }}
    >
      {children}
    </ScrollView>
  );
}
export function Loading({ message = 'Loading the library…' }: { message?: string }) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={message}
      style={{ padding: 24, gap: 20 }}
    >
      <ActivityIndicator color={c.copper} />
      <View style={{ height: 210, backgroundColor: c.surface, borderRadius: 8 }} />
      <View style={{ height: 20, width: '80%', backgroundColor: c.surface, borderRadius: 4 }} />
      <View style={{ height: 15, width: '60%', backgroundColor: c.surface, borderRadius: 4 }} />
    </View>
  );
}
export function Empty({ title, description }: { title: string; description: string }) {
  return (
    <View style={s.empty}>
      <Bookmark size={38} color={c.copper} strokeWidth={1.1} />
      <Title small>{title}</Title>
      <Txt style={[s.description, { textAlign: 'center', marginBottom: 14 }]}>{description}</Txt>
      <Button onPress={() => router.navigate('/(tabs)/explore')}>Explore the library</Button>
    </View>
  );
}
export function ErrorView({ message, retry }: { message: string; retry(): void }) {
  return (
    <View style={s.empty}>
      <Title small>Let’s try that again.</Title>
      <Txt
        selectable
        accessibilityRole="alert"
        style={[s.description, { textAlign: 'center', marginBottom: 12 }]}
      >
        {message}
      </Txt>
      <Button onPress={retry}>Try again</Button>
    </View>
  );
}
export function ProgressBar({ value }: { value: number }) {
  return (
    <View style={s.track}>
      <View style={[s.trackFill, { width: `${Math.max(0, Math.min(100, value * 100))}%` }]} />
    </View>
  );
}
export const s = StyleSheet.create({
  text: { fontFamily: type.body, color: c.text, fontSize: 16, lineHeight: 24 },
  title: {
    fontFamily: type.display,
    fontSize: 37,
    lineHeight: 46,
    letterSpacing: -1.1,
    color: c.text,
  },
  eyebrow: {
    color: c.copper,
    fontFamily: type.medium,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  header: {
    paddingHorizontal: 22,
    paddingTop: 9,
    paddingBottom: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandName: { fontFamily: type.display, fontSize: 23, lineHeight: 27 },
  brandSub: {
    fontFamily: type.medium,
    fontSize: 8,
    color: c.copper,
    letterSpacing: 3,
    lineHeight: 12,
  },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  button: {
    minHeight: 53,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: c.copper,
    borderWidth: 1,
    borderColor: c.copper,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: { backgroundColor: 'transparent', borderColor: c.border },
  buttonText: { fontFamily: type.bold, color: '#142126', fontSize: 14 },
  backBar: { paddingHorizontal: 15, paddingVertical: 8 },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 7,
  },
  card: { marginBottom: 22 },
  cardTitle: {
    fontFamily: type.display,
    fontSize: 24,
    lineHeight: 33,
    letterSpacing: -0.5,
    marginTop: 6,
  },
  description: { fontSize: 14, lineHeight: 23, color: c.muted, marginTop: 8 },
  artBadge: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    backgroundColor: '#102025dd',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 3,
  },
  artBadgeText: { color: c.text, fontSize: 9, letterSpacing: 1, lineHeight: 15 },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomColor: c.border,
    borderBottomWidth: 1,
    marginTop: 8,
    paddingBottom: 6,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    marginTop: 8,
  },
  sectionTitle: { fontFamily: type.display, fontSize: 25, lineHeight: 34, letterSpacing: -0.5 },
  chip: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 30,
    paddingHorizontal: 17,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: { backgroundColor: '#E2AE8512', borderColor: '#E2AE8570' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    paddingVertical: 55,
    gap: 15,
  },
  track: { height: 3, backgroundColor: c.border, borderRadius: 4, overflow: 'hidden' },
  trackFill: { height: '100%', backgroundColor: c.copper },
});
