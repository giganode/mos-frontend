<template>
  <v-container fluid class="d-flex justify-center">
    <v-container style="width: 100%; max-width: 1920px;" class="pa-0">
      <v-container col="12" fluid class="pt-0 pr-0 pl-0 pb-4">
        <h2>{{ $t('user profile') }}</h2>
      </v-container>
      <v-container fluid class="pa-0">
        <v-text-field :label="$t('api token')" v-model="authToken" readonly></v-text-field>
        <v-select v-model="selectedLanguage" :items="languages" item-title="name" item-value="name"
          :label="$t('language')" required @update:modelValue="changeLanguage()" />
        <v-text-field :label="$t('uicolor')" v-model="color" @update:modelValue="changePrimaryColor(color)" type="color"
          hide-details prepend-inner-icon="mdi-palette" />
        <h3 class="mt-4">{{ $t('admin api tokens') }}</h3>
        <v-list>
          <v-list-item v-for="token in adminTokens" :key="token.id">
            <template v-slot:append>
              <v-icon @click="deleteAdminToken(token.id)" color="red">mdi-delete</v-icon>
            </template>
            <v-list-item-title>{{ token.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ token.token }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <div v-if="adminTokens.length === 0">{{ $t('no admin api tokens found') }}</div>
        <v-btn color="primary" class="mt-4" @click="openAdminTokenDialog()">
          {{ $t('create admin api token') }}
        </v-btn>
      </v-container>
    </v-container>
  </v-container>

  <v-dialog v-model="createAdminTokenDialog.value" max-width="500">
    <v-card>
      <v-card-title>{{ $t('create admin api token') }}</v-card-title>
      <v-card-text>
        <v-text-field v-model="createAdminTokenDialog.name" :label="$t('name')" required></v-text-field>
        <v-text-field v-model="createAdminTokenDialog.description" :label="$t('description')"></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="createAdminToken()">{{ $t('create') }}</v-btn>
        <v-btn variant="text" @click="createAdminTokenDialog.value = false">{{ $t('cancel') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-overlay :model-value="overlay" class="align-center justify-center">
    <v-progress-circular color="primary" size="64" indeterminate></v-progress-circular>
  </v-overlay>

</template>

<script setup>
import { onMounted, ref, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { showSnackbarError, showSnackbarSuccess } from '@/composables/snackbar';
import { useTheme } from 'vuetify';

const emit = defineEmits(['refresh-drawer']);
const { availableLocales, locale, t } = useI18n();
const authToken = ref(localStorage.getItem('authToken'));
const overlay = ref(false);
const selectedLanguage = ref(locale.value);
const languages = ref(availableLocales);
const theme = useTheme();
const color = ref(theme.themes.value[theme.global.name.value].colors.primary || '#1976D2');
const adminTokens = ref([]);
const createAdminTokenDialog = reactive({
  value: false,
  name: '',
  description: ''
});

onMounted(() => {
  getAdminTokens();
});
  
const openAdminTokenDialog = () => {
  createAdminTokenDialog.value = true;
  createAdminTokenDialog.name = '';
  createAdminTokenDialog.description = '';
};

const getAdminTokens = async () => {
  try {
    const res = await fetch(`/api/v1/auth/admin-tokens`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
      }
    });

    if (!res.ok) throw new Error('API-Error');
    adminTokens.value = await res.json();
    createAdminTokenDialog.value = false;

  } catch (e) {
    showSnackbarError(e.message);
  } finally {
    overlay.value = false;
  }
};

const createAdminToken = async (name) => {
  const newAdminToken = {
    name: createAdminTokenDialog.name,
    description: createAdminTokenDialog.description
  };

  try {
    overlay.value = true;
    const res = await fetch(`/api/v1/auth/admin-tokens`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newAdminToken)
    });

    if (!res.ok) throw new Error('API-Error');
    showSnackbarSuccess(t('admin api token created'));
    getAdminTokens();

  } catch (e) {
    showSnackbarError(e.message);
  } finally {
    overlay.value = false;
  }
};

const deleteAdminToken = async (id) => {
  try {
    overlay.value = true;
    const res = await fetch(`/api/v1/auth/admin-tokens/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
      }
    });

    if (!res.ok) throw new Error('API-Error');
    showSnackbarSuccess(t('admin api token deleted'));
    getAdminTokens();

  } catch (e) {
    showSnackbarError(e.message);
  } finally {
    overlay.value = false;
  }
};

const changePrimaryColor = async (newColor) => {
  try {
    const res = await fetch(`/api/v1/auth/users/${localStorage.getItem('userid')}`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 'primary_color': newColor })
    })

    if (!res.ok) throw new Error('API-Error');
    color.value = newColor;
    theme.themes.value[theme.global.name.value].colors.primary = newColor;

  } catch (e) {
    showSnackbarError(e.message);
  }
};

const changeLanguage = async () => {
  try {
    const res = await fetch(`/api/v1/auth/users/${localStorage.getItem('userid')}`, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('authToken'),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 'language': selectedLanguage.value })
    })

    if (!res.ok) throw new Error('API-Error');
    locale.value = selectedLanguage.value;

  } catch (e) {
    showSnackbarError(e.message);
  }
};

const copyAuthToken = () => {
  navigator.clipboard.writeText(authToken.value)
    .then(() => showSnackbarSuccess(t('api token copied to clipboard')))
    .catch(err => showSnackbarError(t('failed to copy api token')));
};

</script>