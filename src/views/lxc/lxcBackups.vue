<template>
  <v-container fluid class="d-flex justify-center">
    <v-container style="width: 100%; max-width: 1920px" class="pa-0">
      <v-container col="12" fluid class="pt-0 pr-0 pl-0 pb-4">
        <v-row>
          <v-col cols="auto" class="d-flex align-center">
            <v-icon @click="$router.back()" class="mr-2">mdi-arrow-left</v-icon>
          </v-col>
          <v-col>
            <h2 class="mb-0">{{ $t('backups') }} - {{ props.lxc }}</h2>
          </v-col>
        </v-row>
      </v-container>
      <v-container fluid class="pa-0">
        <v-skeleton-loader v-if="backupsLoading" type="card" :loading="backupsLoading" class="mb-4" />
        <v-card v-if="!backupsLoading && backups.length === 0" fluid class="mb-4 ml-0 mr-0 pa-0">
          <v-card-text class="pa-4">
            {{ $t('no backups have been created yet') }}
          </v-card-text>
        </v-card>
        <v-card v-else fluid style="margin-bottom: 80px" class="pa-0">
          <v-card-text class="pa-0">
            <v-list>
              <template v-if="backups.length > 0" v-for="(backup, index) in backups" :key="backup.container">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon class="cursor-pointer">mdi-zip-disk</v-icon>
                  </template>
                  <v-list-item-title>{{ new Date(backup.created).toLocaleString() }}</v-list-item-title>
                  <v-list-item-subtitle>{{ backup.filename }} - {{ backup.size_human }}</v-list-item-subtitle>
                  <template v-slot:append>
                    <v-menu>
                      <template #activator="{ props }">
                        <v-btn variant="text" icon v-bind="props" color="onPrimary">
                          <v-icon>mdi-dots-vertical</v-icon>
                        </v-btn>
                      </template>
                      <v-list>
                        <v-list-item
                          @click="
                            restoreBackupDialog.value = true;
                            restoreBackupDialog.backup = backup;
                          "
                        >
                          <v-list-item-title>{{ $t('restore') }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item
                          @click="
                            deleteBackupDialog.value = true;
                            deleteBackupDialog.backup = backup;
                          "
                        >
                          <v-list-item-title>{{ $t('delete') }}</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </template>
                </v-list-item>
                <v-divider v-if="index < backups.length - 1" />
              </template>
            </v-list>
          </v-card-text>
        </v-card>
      </v-container>
    </v-container>
  </v-container>

  <!-- Create Backup Dialog -->
  <v-dialog v-model="createBackupDialog.value" max-width="600px">
    <v-card class="pa-0">
      <v-card-title>{{ $t('create backup') }}</v-card-title>
      <v-card-text>
        <v-switch v-model="createBackupDialog.use_snapshot" :label="$t('use snapshot for backups')" inset density="compact" hide-details="auto" color="green"></v-switch>
        <v-switch v-model="createBackupDialog.allow_running" :label="$t('allow running container during backup')" inset density="compact" color="green"></v-switch>
        <v-text-field v-model.number="createBackupDialog.threads" :label="$t('threads')" type="number" min="0"></v-text-field>
        <v-slider v-model="createBackupDialog.compression" :min="0" :max="9" step="1" :label="$t('compression')" thumb-label />
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="createBackupDialog.value = false">{{ $t('cancel') }}</v-btn>
        <v-btn color="primary" @click="createBackup">{{ $t('create') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Delete Backup Dialog -->
  <v-dialog v-model="deleteBackupDialog.value" max-width="600px">
    <v-card class="pa-0">
      <v-card-title>{{ $t('delete backup') }}</v-card-title>
      <v-card-text class="py-0 pt-2">{{ $t('are you sure you want to delete the backup') }}?</v-card-text>
      <v-card-text class="py-0 pb-4">{{ deleteBackupDialog.backup ? deleteBackupDialog.backup.filename : '' }}</v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="deleteBackupDialog.value = false">{{ $t('cancel') }}</v-btn>
        <v-btn color="red" @click="deleteBackup(deleteBackupDialog.backup)">{{ $t('delete') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Restore Backup Dialog -->
  <v-dialog v-model="restoreBackupDialog.value" max-width="600px">
    <v-card class="pa-0">
      <v-card-title>{{ $t('restore backup') }}</v-card-title>
      <v-card-text class="py-0 pt-2">{{ $t('are you sure you want to restore this backup') }}?</v-card-text>
      <v-card-text class="py-0 pb-4">{{ restoreBackupDialog.backup ? restoreBackupDialog.backup.filename : '' }}</v-card-text>
      <v-card-text class="py-0 pt-2">
        <v-text-field v-model="restoreBackupDialog.new_name" :label="$t('new container name')"></v-text-field>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="restoreBackupDialog.value = false">{{ $t('cancel') }}</v-btn>
        <v-btn color="primary" @click="restoreBackup(restoreBackupDialog.backup, restoreBackupDialog.new_name)">{{ $t('restore') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Floating Action Button -->
  <v-fab @click="createBackupDialog.value = true" color="primary" style="position: fixed; bottom: 32px; right: 32px; z-index: 1000" size="large" icon>
    <v-icon>mdi-plus</v-icon>
  </v-fab>

  <v-overlay :model-value="overlay" class="align-center justify-center">
    <v-progress-circular color="onPrimary" size="64" indeterminate></v-progress-circular>
  </v-overlay>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { showSnackbarError, showSnackbarSuccess } from '@/composables/snackbar';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const props = defineProps({
  lxc: String,
});

const router = useRouter();
const emit = defineEmits(['refresh-drawer', 'refresh-notifications-badge']);
const { t } = useI18n();
const overlay = ref(false);
const backups = ref([]);
const backupsLoading = ref(true);
const createBackupDialog = reactive({
  value: false,
  use_snapshot: true,
  compression: 0,
  threads: 0,
  allow_running: false,
});
const deleteBackupDialog = reactive({
  value: false,
  backup: null,
});
const restoreBackupDialog = reactive({
  value: false,
  backup: null,
  backup_file: '',
  new_name: '',
});

onMounted(() => {
  if (!props.lxc) {
    showSnackbarError(t('lxc.noContainerSelected'));
  }
  getLxcBackups();
});

const getLxcBackups = async () => {
  try {
    overlay.value = true;
    const res = await fetch(`/api/v1/lxc/containers/${props.lxc}/backups`, {
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`${t('lxc backups could not be loaded')}|$| ${error.error || t('unknown error')}`);
    }

    backups.value = await res.json();
  } catch (error) {
    const [userMessage, apiErrorMessage] = error.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    backupsLoading.value = false;
    overlay.value = false;
  }
};

const createBackup = async () => {
  try {
    overlay.value = true;
    const res = await fetch(`/api/v1/lxc/containers/${props.lxc}/backups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
      },
      body: JSON.stringify({
        use_snapshot: createBackupDialog.use_snapshot,
        compression: createBackupDialog.compression,
        threads: createBackupDialog.threads,
        allow_running: createBackupDialog.allow_running,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`${t('backup could not be created')}|$| ${error.error || t('unknown error')}`);
    }

    showSnackbarSuccess(t('backup creation started successfully'));
    createBackupDialog.value = false;
    getLxcBackups();
  } catch (error) {
    const [userMessage, apiErrorMessage] = error.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    overlay.value = false;
  }
};

const deleteBackup = async (backup) => {
  try {
    overlay.value = true;
    const res = await fetch(`/api/v1/lxc/containers/${props.lxc}/backups/${backup.filename}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`${t('backup could not be deleted')}|$| ${error.error || t('unknown error')}`);
    }

    showSnackbarSuccess(t('backup deleted successfully'));
    getLxcBackups();
  } catch (error) {
    const [userMessage, apiErrorMessage] = error.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    deleteBackupDialog.value = false;
    overlay.value = false;
  }
};

const restoreBackup = async (backup, newName) => {
  const payload = {
    backup_file: backup.filename,
    new_name: newName,
  };

  try {
    overlay.value = true;
    const res = await fetch(`/api/v1/lxc/containers/${props.lxc}/backups/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`${t('backup could not be restored')}|$| ${error.error || t('unknown error')}`);
    }

    showSnackbarSuccess(t('backup restore started successfully'));
    getLxcBackups();
  } catch (error) {
    const [userMessage, apiErrorMessage] = error.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    restoreBackupDialog.value = false;
    overlay.value = false;
  }
};
</script>
