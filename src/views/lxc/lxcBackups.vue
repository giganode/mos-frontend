<template>
  <v-container fluid class="d-flex justify-center">
    <v-container style="width: 100%; max-width: 1920px" class="pa-0">
      <v-container col="12" fluid class="pt-0 pr-0 pl-0 pb-4">
        <v-row>
          <v-col cols="auto" class="d-flex align-center">
            <v-icon @click="$router.back()" class="mr-2">mdi-arrow-left</v-icon>
          </v-col>
          <v-col>
            <h2 class="mb-0">{{ props.lxc }}</h2>
          </v-col>
        </v-row>
      </v-container>
      <v-container fluid class="pa-0">
        <span class="text-subtitle-1 font-weight-medium">{{ $t('snapshots') }}</span>
        <v-skeleton-loader v-if="snapshotsLoading" type="card" :loading="snapshotsLoading" class="mb-4" style="margin-bottom: 20px" />
        <v-card v-if="!snapshotsLoading && snapshots.length === 0" fluid class="mb-4 ml-0 mr-0 pa-0" style="margin-bottom: 20px">
          <v-card-text class="pa-4">
            {{ $t('no snapshots have been created yet') }}
          </v-card-text>
        </v-card>
        <v-card v-else fluid style="margin-bottom: 20px" class="pa-0">
          <v-card-text class="pa-0">
            <v-list>
              <template v-for="(snapshot, index) in snapshots" :key="snapshot.name">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon class="cursor-pointer">mdi-camera</v-icon>
                  </template>
                  <v-list-item-title>{{ snapshot.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ new Date(snapshot.timestamp).toLocaleString() }}</v-list-item-subtitle>
                  <template v-slot:append>
                    <v-menu>
                      <template #activator="{ props }">
                        <v-btn variant="text" icon v-bind="props" color="onPrimary">
                          <v-icon>mdi-dots-vertical</v-icon>
                        </v-btn>
                      </template>
                      <v-list>
                        <v-list-item @click="openRestoreSnapshotDialog(snapshot)">
                          <v-list-item-title>{{ $t('restore') }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="openCloneSnapshotDialog(snapshot)">
                          <v-list-item-title>{{ $t('clone') }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="openDeleteSnapshotDialog(snapshot)">
                          <v-list-item-title>{{ $t('delete') }}</v-list-item-title>
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </template>
                </v-list-item>
                <v-divider v-if="index < snapshots.length - 1" />
              </template>
            </v-list>
          </v-card-text>
        </v-card>
        <span class="text-subtitle-1 font-weight-medium">{{ $t('backups') }}</span>
        <v-skeleton-loader v-if="backupsLoading" type="card" :loading="backupsLoading" class="mb-4" style="margin-bottom: 80px" />
        <v-card v-if="!backupsLoading && backups.length === 0" fluid class="mb-4 ml-0 mr-0 pa-0" style="margin-bottom: 80px">
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
                        <v-list-item @click="openRestoreBackupDialog(backup)">
                          <v-list-item-title>{{ $t('restore') }}</v-list-item-title>
                        </v-list-item>
                        <v-list-item @click="openDeleteBackupDialog(backup)">
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
    <v-card class="pa-0" :title="$t('create backup')" prepend-icon="mdi-plus">
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
        <v-btn color="primary" @click="createBackup(createBackupDialog.use_snapshot, createBackupDialog.compression, createBackupDialog.threads, createBackupDialog.allow_running)">
          {{ $t('create') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Delete Backup Dialog -->
  <v-dialog v-model="deleteBackupDialog.value" max-width="600px">
    <v-card class="pa-0" :title="$t('delete backup')" prepend-icon="mdi-delete">
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
    <v-card class="pa-0" :title="$t('restore backup')" prepend-icon="mdi-backup-restore">
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

  <!-- Create Snapshot Dialog -->
  <v-dialog v-model="createSnapshotDialog.value" max-width="600px">
    <v-card class="pa-0" :title="$t('create snapshot')" prepend-icon="mdi-camera-plus">
      <v-card-text>
        <v-text-field v-model="createSnapshotDialog.snapshot_name" :label="$t('snapshot name')" hide-details="auto"></v-text-field>
        <v-switch v-model="createSnapshotDialog.allow_running" :label="$t('allow running container')" inset color="green" hide-details="auto"></v-switch>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="createSnapshotDialog.value = false">{{ $t('cancel') }}</v-btn>
        <v-btn color="primary" @click="createSnapshot(createSnapshotDialog.snapshot_name, createSnapshotDialog.allow_running)">{{ $t('create') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Delete Snapshot Dialog -->
  <v-dialog v-model="deleteSnapshotDialog.value" max-width="600px">
    <v-card class="pa-0" :title="$t('delete snapshot')" prepend-icon="mdi-delete">
      <v-card-text class="py-0 pt-2">{{ $t('are you sure you want to delete the snapshot') }}?</v-card-text>
      <v-card-text class="py-0 pb-4">{{ deleteSnapshotDialog.snapshot ? deleteSnapshotDialog.snapshot.name : '' }}</v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="deleteSnapshotDialog.value = false">{{ $t('cancel') }}</v-btn>
        <v-btn color="red" @click="deleteSnapshot(deleteSnapshotDialog.snapshot)">{{ $t('delete') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Restore Snapshot Dialog -->
  <v-dialog v-model="restoreSnapshotDialog.value" max-width="600px">
    <v-card class="pa-0" :title="$t('restore snapshot')" prepend-icon="mdi-backup-restore">
      <v-card-text class="py-0 pt-2">{{ $t('are you sure you want to restore this snapshot') }}?</v-card-text>
      <v-card-text class="py-0 pb-4">{{ restoreSnapshotDialog.snapshot ? restoreSnapshotDialog.snapshot.name : '' }}</v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="restoreSnapshotDialog.value = false">{{ $t('cancel') }}</v-btn>
        <v-btn color="primary" @click="restoreSnapshot(restoreSnapshotDialog.snapshot)">{{ $t('restore') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Clone Snapshot Dialog -->
  <v-dialog v-model="cloneSnapshotDialog.value" max-width="600px">
    <v-card class="pa-0" :title="$t('clone snapshot')" prepend-icon="mdi-content-copy">
      <v-card-text class="py-0 pt-2">{{ $t('are you sure you want to clone this snapshot') }}?</v-card-text>
      <v-card-text class="py-0 pb-4">{{ cloneSnapshotDialog.snapshot ? cloneSnapshotDialog.snapshot.name : '' }}</v-card-text>
      <v-card-text class="py-0 pt-2">
        <v-text-field v-model="cloneSnapshotDialog.new_name" :label="$t('new container name')"></v-text-field>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="cloneSnapshotDialog.value = false">{{ $t('cancel') }}</v-btn>
        <v-btn color="primary" @click="cloneSnapshot(cloneSnapshotDialog.snapshot, cloneSnapshotDialog.new_name)">{{ $t('clone') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Floating Action Button with Menu -->
  <v-menu location="top">
    <template v-slot:activator="{ props }">
      <v-fab v-bind="props" color="primary" style="position: fixed; bottom: 32px; right: 32px; z-index: 1000" size="large" icon>
        <v-icon>mdi-plus</v-icon>
      </v-fab>
    </template>
    <v-list>
      <v-list-item @click="openCreateBackupDialog()">
        <template v-slot:prepend>
          <v-icon>mdi-plus</v-icon>
        </template>
        <v-list-item-title>{{ $t('create backup') }}</v-list-item-title>
      </v-list-item>
      <v-list-item @click="openCreateSnapshotDialog()">
        <template v-slot:prepend>
          <v-icon>mdi-camera-plus</v-icon>
        </template>
        <v-list-item-title>{{ $t('create snapshot') }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>

  <v-overlay :model-value="overlay" class="align-center justify-center">
    <v-progress-circular color="onPrimary" size="64" indeterminate></v-progress-circular>
  </v-overlay>
</template>

<script setup>
import { ref, onMounted, reactive, h } from 'vue';
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
const snapshots = ref([]);
const snapshotsLoading = ref(true);
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
const createSnapshotDialog = reactive({
  value: false,
  snapshot_name: '',
  allow_running: false,
});
const deleteSnapshotDialog = reactive({
  value: false,
  snapshot: null,
});
const restoreSnapshotDialog = reactive({
  value: false,
  snapshot: null,
});
const cloneSnapshotDialog = reactive({
  value: false,
  snapshot: null,
  new_name: '',
});

onMounted(() => {
  getLxcBackups();
  getLxcSnapshots();
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

const createBackup = async (use_snapshot, compression, threads, allow_running) => {
  const payload = {
    use_snapshot: use_snapshot,
    compression: compression,
    threads: threads,
    allow_running: allow_running,
  };

  try {
    overlay.value = true;
    const res = await fetch(`/api/v1/lxc/containers/${props.lxc}/backups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`${t('backup could not be created')}|$| ${error.error || t('unknown error')}`);
    }

    showSnackbarSuccess(t('backup creation started successfully'));
    getLxcBackups();
    createBackupDialog.value = false;
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
    deleteBackupDialog.value = false;
  } catch (error) {
    const [userMessage, apiErrorMessage] = error.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
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
    restoreBackupDialog.value = false;
  } catch (error) {
    const [userMessage, apiErrorMessage] = error.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    overlay.value = false;
  }
};

const getLXCService = async () => {
  try {
    const res = await fetch('/api/v1/mos/settings/lxc', {
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`${t('lxc service could not be loaded')}|$| ${error.error || t('unknown error')}`);
    }

    const lxcSettings = await res.json();
    return lxcSettings;
  } catch (e) {
    const [userMessage, apiErrorMessage] = e.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  }
};

const getLxcSnapshots = async () => {
  try {
    const res = await fetch(`/api/v1/lxc/containers/${props.lxc}/snapshots`, {
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`${t('lxc snapshots could not be loaded')}|$| ${error.error || t('unknown error')}`);
    }

    snapshots.value = await res.json();
  } catch (e) {
    const [userMessage, apiErrorMessage] = e.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    snapshotsLoading.value = false;
  }
};

const createSnapshot = async (snapshotName, allowRunning) => {
  const payload = {
    snapshot_name: snapshotName,
    allow_running: allowRunning,
  };

  try {
    overlay.value = true;
    const res = await fetch(`/api/v1/lxc/containers/${props.lxc}/snapshots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`${t('snapshot could not be created')}|$| ${error.error || t('unknown error')}`);
    }

    showSnackbarSuccess(t('snapshot created successfully'));
    getLxcSnapshots();
    createSnapshotDialog.value = false;
  } catch (e) {
    const [userMessage, apiErrorMessage] = e.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    overlay.value = false;
  }
};

const deleteSnapshot = async (snapshot) => {
  try {
    overlay.value = true;
    const res = await fetch(`/api/v1/lxc/containers/${props.lxc}/snapshots/${snapshot.name}`, {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`${t('snapshot could not be deleted')}|$| ${error.error || t('unknown error')}`);
    }

    showSnackbarSuccess(t('snapshot deleted successfully'));
    getLxcSnapshots();
    deleteSnapshotDialog.value = false;
  } catch (e) {
    const [userMessage, apiErrorMessage] = e.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    overlay.value = false;
  }
};

const restoreSnapshot = async (snapshot) => {
  try {
    overlay.value = true;
    const res = await fetch(`/api/v1/lxc/containers/${props.lxc}/snapshots/${snapshot.name}/restore`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`${t('snapshot could not be restored')}|$| ${error.error || t('unknown error')}`);
    }

    showSnackbarSuccess(t('snapshot restore started successfully'));
    getLxcSnapshots();
    restoreSnapshotDialog.value = false;
  } catch (e) {
    const [userMessage, apiErrorMessage] = e.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    overlay.value = false;
  }
};

const cloneSnapshot = async (snapshot, newName) => {
  const payload = {
    new_name: newName,
  };

  try {
    overlay.value = true;
    const res = await fetch(`/api/v1/lxc/containers/${props.lxc}/snapshots/${snapshot.name}/clone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`${t('snapshot could not be cloned')}|$| ${error.error || t('unknown error')}`);
    }

    showSnackbarSuccess(t('snapshot cloned successfully'));
    getLxcSnapshots();
    cloneSnapshotDialog.value = false;
  } catch (e) {
    const [userMessage, apiErrorMessage] = e.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    overlay.value = false;
  }
};

const openCreateBackupDialog = async () => {
  createBackupDialog.value = true;
  overlay.value = true;
  const lxcSettings = await getLXCService();
  overlay.value = false;
  createBackupDialog.use_snapshot = lxcSettings.use_snapshot || true;
  createBackupDialog.compression = lxcSettings.compression || 0;
  createBackupDialog.threads = lxcSettings.threads || 0;
  createBackupDialog.allow_running = false;
};
const openDeleteBackupDialog = (backup) => {
  deleteBackupDialog.value = true;
  deleteBackupDialog.backup = backup;
};
const openRestoreBackupDialog = (backup) => {
  restoreBackupDialog.value = true;
  restoreBackupDialog.backup = backup;
  restoreBackupDialog.new_name = '';
};
const openCreateSnapshotDialog = () => {
  createSnapshotDialog.value = true;
  createSnapshotDialog.snapshot_name = '';
  createSnapshotDialog.allow_running = false;
};
const openRestoreSnapshotDialog = (snapshot) => {
  restoreSnapshotDialog.value = true;
  restoreSnapshotDialog.snapshot = snapshot;
};
const openCloneSnapshotDialog = (snapshot) => {
  cloneSnapshotDialog.value = true;
  cloneSnapshotDialog.snapshot = snapshot;
  cloneSnapshotDialog.new_name = '';
};
const openDeleteSnapshotDialog = (snapshot) => {
  deleteSnapshotDialog.value = true;
  deleteSnapshotDialog.snapshot = snapshot;
};
</script>
