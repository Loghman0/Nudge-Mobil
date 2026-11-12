import {useEffect, useRef, useState} from 'react';
import {Animated, Easing, Image, StyleSheet, Text, View} from 'react-native';
import {layout, typography, type Theme} from '../theme';
import {useReducedMotion} from './motion';

export function OpeningMotion({ready, theme, onComplete}: {
  ready: boolean;
  theme: Theme;
  onComplete: () => void;
}) {
  const reduced = useReducedMotion();
  const beat = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (reduced) return;
    beat.setValue(0);
    const animation = Animated.timing(beat, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start(({finished}) => { if (finished) setSettled(true); });
    return () => animation.stop();
  }, [beat, reduced]);

  useEffect(() => {
    if (!ready || (!reduced && !settled)) return;
    if (reduced) { onComplete(); return; }
    const exit = Animated.timing(opacity, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
      isInteraction: false,
    });
    exit.start(({finished}) => { if (finished) onComplete(); });
    return () => exit.stop();
  }, [ready, reduced, settled, opacity, onComplete]);

  function pageMotion(side: -1 | 1) {
    return reduced ? {} : {
      opacity: beat.interpolate({inputRange: [0, 0.12, 1], outputRange: [0, 1, 1]}),
      transform: [
        {translateX: beat.interpolate({inputRange: [0, 1], outputRange: [side * 45, side * 15]})},
        {translateY: beat.interpolate({inputRange: [0, 1], outputRange: [19, 9]})},
        {rotate: beat.interpolate({inputRange: [0, 1], outputRange: [`${side * 18}deg`, `${side * 9}deg`]})},
      ],
    };
  }

  return <Animated.View
    accessible accessibilityRole="image" accessibilityLabel="Opening Nudge"
    style={[StyleSheet.absoluteFill, styles.overlay, {backgroundColor: theme.surface, opacity}]}
  >
    <View style={styles.emblem} importantForAccessibility="no-hide-descendants">
      <Animated.View style={[styles.page, styles.back, {backgroundColor: theme.selection, borderColor: theme.line}, pageMotion(-1)]}/>
      <Animated.View style={[styles.page, styles.front, {backgroundColor: theme.card, borderColor: theme.line}, pageMotion(1)]}/>
      <Animated.View style={reduced ? undefined : {transform: [{scale: beat.interpolate({inputRange: [0, 0.7, 1], outputRange: [0.9, 1.035, 1]})}]}}>
        <Image accessible={false} source={require('../../assets/mark.png')} style={styles.mark}/>
      </Animated.View>
    </View>
    <Animated.Text accessible={false} style={[styles.wordmark, {color: theme.text, opacity: reduced ? 1 : beat.interpolate({inputRange: [0, 0.22, 0.86, 1], outputRange: [0, 0, 1, 1]})}]}>Nudge</Animated.Text>
  </Animated.View>;
}

const styles = StyleSheet.create({
  overlay: {alignItems: 'center', justifyContent: 'center', gap: layout.space.lg},
  emblem: {width: 184, height: 116, alignItems: 'center', justifyContent: 'center'},
  page: {position: 'absolute', width: 80, height: 90, borderRadius: 19, borderWidth: 1},
  back: {transform: [{translateX: -15}, {translateY: 9}, {rotate: '-9deg'}]},
  front: {transform: [{translateX: 15}, {translateY: 9}, {rotate: '9deg'}]},
  mark: {width: 92, height: 92},
  wordmark: {...typography.hero, fontSize: 36, lineHeight: 46, textAlign: 'center'},
});
