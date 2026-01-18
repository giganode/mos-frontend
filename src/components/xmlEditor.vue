<template>
  <div ref="editorContainer" class="xml-editor-wrapper"></div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useTheme } from 'vuetify';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { xml } from '@codemirror/lang-xml';
import { oneDark } from '@codemirror/theme-one-dark';
import { duotoneLight } from '@uiw/codemirror-theme-duotone';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

const theme = useTheme();
const editorContainer = ref(null);
let editorView = null;

const createEditor = () => {
  if (!editorContainer.value) return;

  const isDark = theme.global.current.value.dark;

  const extensions = [
    basicSetup,
    xml(),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const value = update.state.doc.toString();
        emit('update:modelValue', value);
      }
    }),
    EditorView.lineWrapping
  ];

  if (isDark) {
    extensions.push(oneDark);
  } else {
    extensions.push(duotoneLight);
  }

  const state = EditorState.create({
    doc: props.modelValue || '',
    extensions
  });

  editorView = new EditorView({
    state,
    parent: editorContainer.value
  });
};

const destroyEditor = () => {
  if (editorView) {
    editorView.destroy();
    editorView = null;
  }
};

watch(() => props.modelValue, (newValue) => {
  if (editorView) {
    const currentValue = editorView.state.doc.toString();
    if (newValue !== currentValue) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: newValue || ''
        }
      });
    }
  }
});

watch(() => theme.global.current.value.dark, () => {
  destroyEditor();
  createEditor();
});

onMounted(() => {
  createEditor();
});

onUnmounted(() => {
  destroyEditor();
});
</script>

<style scoped>
.xml-editor-wrapper {
  position: relative;
  width: 100%;
  height: 500px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

.xml-editor-wrapper :deep(.cm-editor) {
  height: 100%;
}

.xml-editor-wrapper :deep(.cm-scroller) {
  font-family: Consolas, Monaco, 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
}

.xml-editor-wrapper :deep(.cm-scroller)::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.xml-editor-wrapper :deep(.cm-scroller)::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-on-surface), 0.05);
}

.xml-editor-wrapper :deep(.cm-scroller)::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 6px;
}

.xml-editor-wrapper :deep(.cm-scroller)::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-on-surface), 0.3);
}
</style>
