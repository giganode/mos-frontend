<template>
  <div id="terminal" style="width: 100vw; height: 100vh; padding: 8px; background: #000000"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { Terminal } from '@xterm/xterm';
import { io } from 'socket.io-client';
import { FitAddon } from '@xterm/addon-fit';
import { useI18n } from 'vue-i18n';
import '@xterm/xterm/css/xterm.css';

let socket, term;
const emit = defineEmits(['refresh-drawer', 'refresh-notifications-badge']);
const { t } = useI18n();

let fitAddon = new FitAddon();

onMounted(() => {
  term = new Terminal({ cursorBlink: true, fontFamily: 'monospace', fontSize: 14 });
  term.loadAddon(fitAddon);
  term.open(document.getElementById('terminal'));
  term.focus();
  fitAddon.fit();

  socket = io(window.location.hostname + '/terminal', { path: '/api/v1/socket.io/' });

  socket.on('connect', () => {
    term.write(t('connection to mos terminal established') + '\r\n');
  });

  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get('sessionId');
  socket.emit('join-session', {
    sessionId: sessionId,
    token: localStorage.getItem('authToken'),
  });

  socket.on('session-joined', (info) => {
    term.resize(info.cols, info.rows);
    fitAddon.fit();
    socket.emit('terminal-resize', { cols: term.cols, rows: term.rows });
  });

  socket.on('terminal-output', (data) => {
    term.write(data);
  });

  term.onData((data) => {
    socket.emit('terminal-input', data);
  });

  socket.on('disconnect', () => {
    term.write(t('connection closed') + '\r\n');
  });
});

window.addEventListener('resize', () => {
  fitAddon.fit();
});

onBeforeUnmount(() => {
  if (socket) socket.disconnect();
  if (term) term.dispose();
  if (fitAddon) fitAddon.dispose();
});

</script>
