<script lang="ts" setup>
import { WindowState } from '@shared/types'
import { useIpcRenderer } from '@vueuse/electron'
import { storeToRefs } from 'pinia'
import { useDisplay } from 'vuetify'

import WindowControl from '@/components/layout/WindowControl.vue'
import { useAppStore } from '@/store/app'
import is from '@/util/is'

const appStore = useAppStore()
const ipcRenderer = useIpcRenderer()
const { windowState } = storeToRefs(appStore)

const title = useTitle(void 0, { observe: true })
const { mdAndUp } = useDisplay()
const isShowWindowControl = computed(() => {
  return (is.windows() || is.linux()) && mdAndUp.value
})

function handleToggleMaximize() {
  if (windowState.value === WindowState.MAXIMIZED) {
    ipcRenderer.invoke(WindowState.NORMAL)
  } else {
    ipcRenderer.invoke(WindowState.MAXIMIZED)
  }
}
const height = computed(() => {
  return is.macOS() ? 6 : void 0
})
// coding here
</script>
<template>
  <v-system-bar :height="height" class="drag-area px-0" color="surface" @dblclick="handleToggleMaximize">
    <span v-if="isShowWindowControl" class="ml-4 line-clamp-1 w-75 text-left">
      {{ title }}
    </span>

    <v-spacer></v-spacer>

    <WindowControl v-if="isShowWindowControl" />
  </v-system-bar>
</template>
