<template>
  <div id="terminal" style="width: 100vw; height: 100vh; padding: 8px; background: #000000"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount } from 'vue';
import { Terminal } from '@xterm/xterm';
import { io } from 'socket.io-client';
import { FitAddon } from '@xterm/addon-fit';
import { ClipboardAddon } from '@xterm/addon-clipboard';
import { useI18n } from 'vue-i18n';
import '@xterm/xterm/css/xterm.css';

let socket, term;
const emit = defineEmits(['refresh-drawer', 'refresh-notifications-badge']);
const { t } = useI18n();

const fitAddon = new FitAddon();
const clipboardAddon = new ClipboardAddon();

onMounted(() => {
  term = new Terminal({ cursorBlink: true, fontFamily: 'monospace', fontSize: 14 });
  term.loadAddon(fitAddon);
  term.loadAddon(clipboardAddon);
  term.open(document.getElementById('terminal'));
  term.focus();
  fitAddon.fit();

  term.onSelectionChange(() => {
    if (!term.hasSelection()) return;
    const selected = term.getSelection();

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(selected);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = selected;
      textarea.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
      } catch (e) {}
      document.body.removeChild(textarea);
    }
  });

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
  if (clipboardAddon) clipboardAddon.dispose();
});
</script>
