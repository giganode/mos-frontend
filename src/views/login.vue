<template>
  <div :class="$vuetify.display.mdAndUp ? 'login-wrap' : 'login-wrap-mobile'" class="d-flex">
    <v-container class="py-10" max-width="1200">
        <v-row align="center" justify="center" no-gutters class="w-100" :style="$vuetify.display.mdAndUp ? 'min-height: 600px;' : ''">
        <!-- Left side -->
        <v-col cols="12" sm="5" class="pa-5 d-flex flex-column justify-center align-center text-center left-col">
          <div class="brand centered">
            <v-img :src="logoColorThemed" alt="MOS Logo" width="200" class="mx-auto mb-6" contain />
            <h1 class="brand__title">{{ t('mos portal') }}</h1>
            <p class="brand__copy">{{ t('mos slogan') }}</p>
          </div>
        </v-col>

        <!-- Vertical Divider -->
        <v-col cols="auto" class="d-none d-sm-flex align-self-stretch px-0">
          <v-divider vertical />
        </v-col>

        <!-- Right side -->
        <v-col cols="12" sm="5" class="pa-5 d-flex align-center">
          <v-card class="elevated" elevation="8" style="width: 100%">
            <v-card-text class="pa-6">
              <h2>{{ t('login') }}</h2>
              <p class="text-medium-emphasis mb-6 text-body-2">{{ t('welcome back') }}</p>
              <v-form ref="formRef" v-model="isValid" @submit.prevent="onSubmit">
                <v-text-field v-model.trim="username" :label="t('username') || 'Username'" autocomplete="username" variant="outlined" density="comfortable" :rules="[rules.required]" class="mb-3" />
                <v-text-field
                  v-model="password"
                  :label="t('password') || 'Password'"
                  :type="showPassword ? 'text' : 'password'"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  autocomplete="current-password"
                  variant="outlined"
                  density="comfortable"
                  :rules="[rules.required]"
                  @click:append-inner="showPassword = !showPassword"
                  class="mb-1"
                />
                <v-btn type="submit" block size="large" :loading="loading" :disabled="!isValid || loading">
                  {{ t('login') }}
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTheme } from 'vuetify';
import { showSnackbarError, showSnackbarSuccess } from '@/composables/snackbar';
import mosBlack from '/mos_black.png';
import mosWhite from '/mos_white.png';

const { locale, t } = useI18n();
const theme = useTheme();
const username = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const isValid = ref(false);
const formRef = ref(null);

const logoColorThemed = computed(() => {
  return theme.global.name.value === 'dark' ? mosWhite : mosBlack;
});

const emit = defineEmits(['refresh-drawer', 'login-success']);

const rules = {
  required: (v) => !!v || v === 0 || t('required') || 'Required',
};

const onSubmit = async () => {
  const ok = await formRef.value?.validate();
  if (!ok) return;
  await login();
};

const login = async () => {
  try {
    loading.value = true;
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`${t('login failed')}|$| ${error.error || t('unknown error')}`);
    }

    const result = await res.json();

    localStorage.setItem('authToken', result.token);
    localStorage.setItem('userid', result.user.id);
    localStorage.setItem('byte_format', result.user.byte_format || 'binary');
    localStorage.setItem('username', username.value);
    localStorage.setItem('hideInactiveMenus', result.user.hide_inactive_menus ? 'true' : 'false');
    localStorage.setItem('groupMenus', result.user.group_menus ? 'true' : 'false');

    if(result.user.darkmode) {
      theme.change('dark');
    } else {
      theme.change('light');
    }
    locale.value = result.user.language || 'en';
    theme.themes.value[theme.global.name.value].colors.primary = result.user.primary_color || '#1976D2';

    showSnackbarSuccess?.(t('logged in successfully'));

    emit('refresh-drawer');
    emit('login-success');
  } catch (e) {
    const [userMessage, apiErrorMessage] = (e.message || '').split('|$|');
    showSnackbarError?.(userMessage, apiErrorMessage);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(180deg, color-mix(in oklab, var(--v-theme-primary) 6%, transparent) 0%, transparent 30%),
    linear-gradient(90deg, color-mix(in oklab, var(--v-theme-secondary) 5%, transparent) 0%, transparent 40%);
}
.login-wrap-mobile {
  min-height: 100vh;
  display: flex;
  align-items: center;
  background: linear-gradient(180deg, color-mix(in oklab, var(--v-theme-primary) 6%, transparent) 0%, transparent 30%),
    linear-gradient(90deg, color-mix(in oklab, var(--v-theme-secondary) 5%, transparent) 0%, transparent 40%);  
}

.elevated {
  border-radius: 16px;
  background: var(--v-theme-surface);
  border: 1px solid color-mix(in oklab, var(--v-theme-on-surface) 10%, transparent);
}

.brand__title {
  font-weight: 700;
  font-size: clamp(24px, 3vw, 36px);
  line-height: 1.10;
}
.brand__copy {
  opacity: 0.8;
  max-width: 40ch;
}

@media (min-width: 800px) {
  .left-col {
    border-right: 1px solid color-mix(in oklab, var(--v-theme-on-surface) 10%, transparent);
  }
}
</style>
