import {getTrackDetail} from '@/api/music';
import { favTrack, getLikeList } from '@/api'
import {getUserPlaylist} from '@/api/user';
import {sleep} from '@util/fn';
import {make} from 'vuex-pathify';
const PLAY_MODE = {
  ORDER: 0,
  CYCLE: 1,
  SINGLE_CYCLE: 2,
  RANDOM: 3,
};
const state = {
  playing: false,
  track: JSON.parse(localStorage.getItem('track')) ?? {},
  currentTime: localStorage.getItem('currentTime') ?? 0,
  playingList: JSON.parse(localStorage.getItem('playingList')) ?? [],
  showList: false,
  showLyricsPage: false,
  mode: PLAY_MODE.CYCLE,
  loadAudio: false,
  likes: [],
  playlist: [],
};

export default {
  namespaced: true,
  state,
  getters: {
    index(state) {
      return state.playingList.findIndex(track => track.id === state.track.id);
    },
    nextTrackId(state, getters) {
      const index = getters['index'];
      let id = state.track.id;
      const len = state.playingList.length;
      const {mode, playingList} = state;
      if (mode === PLAY_MODE.CYCLE || (mode === PLAY_MODE.ORDER && len -1 !== index)){ // 顺序播放（非最后一曲），或 循环播放，否则下一曲都是当前歌曲
        id = playingList[(index + 1) === playingList.length ? 0 : index + 1]?.id;
      }
      return id;
    },
    prevTrackId(state, getters) {
      const index = getters['index'];
      return state.playingList[index  === 0 ? (state.playingList.length - 1) : index - 1]?.id;
    },
    liked: (state) => !!state.likes.find(i => i === state.track.id),
  },
  actions: {
    async fetch({commit, rootGetters}) {
      if (rootGetters['settings/logged']) {
        const [likesRes, playlistRes] = await Promise.all([getLikeList(), getUserPlaylist({
          timestamp: new Date().getTime(),
          uid: rootGetters['settings/userId'] ?? '',
        })]);
        commit('likes', likesRes.ids);
        commit('playlist', playlistRes.playlist);
      }

    },
    updatePlayingList({commit}, list) {
      localStorage.setItem('playingList', JSON.stringify(list));
      commit('playingList', list);
    },
    async updateTrack({ rootGetters, commit, dispatch, getters }, id) {
      commit('playing', false);
      commit('loadAudio', true);
      await sleep();
      const track = await getTrackDetail(id, rootGetters['settings/logged']);
      commit('currentTime', 0);
      commit('track', track);
      localStorage.setItem('track', JSON.stringify(track));
      if (!track.url) {
        dispatch('snackbar/show', {text: '歌曲暂时不可用', type: 'warning'}, {root: true});
        dispatch('updateTrack', getters['nextTrackId']);
      } else {
        commit('playing', true);
      }
    },
    async favSong({ rootGetters, commit, dispatch, state }, { id, like }) {
      let likes = state.likes;
      if (!rootGetters['settings/logged']) {
        dispatch('snackbar/show', {text: '需要登录', type: 'warning'}, {root: true});
      } else {
        await favTrack({ id, like });
        if (like) {
          likes.push(id);
        } else {
          likes = likes.filter(i => i !== id);
        }
        commit('likes', likes);
      }
    },
  },
  mutations: {
    ...make.mutations(state),
    playingList(state, list) {
      state.playingList = list;
    },
    UPDATE_PLAYER(state, payload) {
      Object.keys(payload).map(key => {
        state[key] = payload[key];
      });
    },
  },
};
