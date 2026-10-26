// ============================================================
// TracMusic — App Entry Point
//
// react-native-track-player REQUIRES PlaybackService to be
// registered here BEFORE expo-router takes over.
// ============================================================

import 'expo-router/entry';
import TrackPlayer from 'react-native-track-player';
import { PlaybackService } from './src/services/audio/PlaybackService';

TrackPlayer.registerPlaybackService(() => PlaybackService);
