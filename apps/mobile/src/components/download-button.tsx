import { View } from 'react-native';
import { router } from 'expo-router';
import { Download, Check, X } from 'lucide-react-native';
import { colors as c } from '@bastiat/design-tokens';
import type { Lesson } from '@bastiat/contracts';
import { useDownloads, getDownload, queueDownload, cancelDownload } from '../services/downloads';
import { ProgressBar, Txt } from './ui';
import { MotionPressable } from './motion';
export function DownloadButton({ lesson }: { lesson: Lesson }) {
  useDownloads();
  const item = getDownload(lesson.slug);
  const active = item && ['queued', 'downloading', 'verifying'].includes(item.state);
  const ready = item?.state === 'ready';
  const label = ready
    ? 'Downloaded'
    : active
      ? item.state === 'verifying'
        ? 'Verifying…'
        : `Downloading ${Math.floor((item.received / lesson.asset.bytes) * 100)}%`
      : `Download · ${(lesson.asset.bytes / 1024 / 1024).toFixed(1)} MB`;
  return (
    <View>
      <MotionPressable
        accessibilityRole="button"
        accessibilityLabel={active ? 'Cancel download' : label}
        onPress={() =>
          active
            ? cancelDownload(lesson.slug)
            : ready
              ? router.navigate({ pathname: '/(tabs)/library', params: { tab: 'downloads' } })
              : queueDownload(lesson)
        }
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          minHeight: 49,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderWidth: 1,
          borderColor: ready ? c.sage : active ? c.copper : c.border,
          borderRadius: 6,
        }}
      >
        {ready ? (
          <Check size={18} color={c.sage} />
        ) : active ? (
          <X size={18} color={c.copper} />
        ) : (
          <Download size={18} color={c.muted} />
        )}
        <Txt
          style={{
            flexShrink: 1,
            textAlign: 'center',
            fontSize: 13,
            color: ready ? c.sage : c.muted,
          }}
        >
          {label}
        </Txt>
      </MotionPressable>
      {active && (
        <View style={{ marginTop: 7 }}>
          <ProgressBar value={item.received / lesson.asset.bytes} />
        </View>
      )}
      {item?.state === 'failed' && (
        <Txt accessibilityRole="alert" style={{ fontSize: 12, color: c.danger, marginTop: 8 }}>
          {item.error}
        </Txt>
      )}
    </View>
  );
}
