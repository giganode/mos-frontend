<template>
  <v-container fluid class="d-flex justify-center">
    <v-container style="width: 100%; max-width: 1920px" class="pa-0">
      <v-container col="12" fluid class="pt-0 pr-0 pl-0 pb-4">
        <h2>{{ $t('disks') }}</h2>
      </v-container>
      <v-container fluid class="pa-0">
        <v-skeleton-loader v-if="!disksLoaded" type="table-heading, table-row@5" :loading="!disksLoaded" class="mb-4" />
        <v-card v-else-if="disksLoaded && disks.length === 0" fluid class="pa-4 mb-4">
          <v-card-text class="pa-0">
            {{ $t('no disks found') }}
          </v-card-text>
        </v-card>
        <v-card v-else-if="disksLoaded && disks.length > 0" fluid style="margin-bottom: 80px" class="pa-0">
          <v-table density="comfortable" style="overflow-x: auto; table-layout: fixed">
            <thead>
              <tr style="background-color: rgba(0, 0, 0, 0.04)">
                <th style="white-space: nowrap; width: 32px">{{ $t('status') }}</th>
                <th style="white-space: nowrap; width: 200px; overflow: hidden; text-overflow: ellipsis">{{ $t('device') }}</th>
                <th style="white-space: nowrap">{{ $t('size') }}</th>
                <th style="white-space: nowrap">{{ $t('usage') }}</th>
                <th style="white-space: nowrap">{{ $t('model') }}</th>
                <th style="white-space: nowrap">{{ $t('partitions') }}</th>
                <th style="white-space: nowrap">{{ $t('type') }}</th>
                <th style="white-space: nowrap">{{ $t('filesystem') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="disk in disks" :key="disk.device">
                <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">
                  <v-menu>
                    <template #activator="{ props }">
                      <v-icon v-bind="props" class="cursor-pointer" :color="disk.powerStatus === 'active' ? 'green' : disk.powerStatus === 'standby' ? 'blue' : 'red'">
                        {{ getDiskIcon(disk.type) }}
                      </v-icon>
                    </template>
                    <v-list>
                      <v-list-item @click="sleepDisk(disk)">
                        <template #prepend>
                          <v-icon>mdi-motion-pause</v-icon>
                        </template>
                        <v-list-item-title>{{ $t('sleep') }}</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="wakeDisk(disk)">
                        <template #prepend>
                          <v-icon>mdi-motion-play</v-icon>
                        </template>
                        <v-list-item-title>{{ $t('wake up') }}</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="mountDisk(disk)">
                        <template #prepend>
                          <v-icon>mdi-play</v-icon>
                        </template>
                        <v-list-item-title>{{ $t('mount') }}</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="unmountDisk(disk)">
                        <template #prepend>
                          <v-icon>mdi-eject</v-icon>
                        </template>
                        <v-list-item-title>{{ $t('unmount') }}</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="openFormatDialog(disk)">
                        <template #prepend>
                          <v-icon>mdi-broom</v-icon>
                        </template>
                        <v-list-item-title>{{ $t('format') }}</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </td>
                <td style="max-width: 200px">
                  <div class="text-ellipsis" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{ disk.device }}</div>
                  <div v-if="disk.serial" class="text-caption text-medium-emphasis text-ellipsis" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{ disk.serial }}</div>
                </td>
                <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{ disk.size_human }}</td>
                <td style="min-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis">
                  <template v-if="disk.partitions?.some((p) => p.status?.mounted)">
                    <div v-for="p in disk.partitions.filter((p) => p.status?.mounted)" :key="p.device" class="my-1">
                      <v-progress-linear
                        :model-value="p.status.totalSpace ? (p.status.usedSpace / p.status.totalSpace) * 100 : 0"
                        :color="p.status.totalSpace && p.status.usedSpace / p.status.totalSpace > 0.9 ? 'red' : p.status.usedSpace / p.status.totalSpace > 0.7 ? 'orange' : 'green'"
                        height="16"
                        rounded
                      >
                        <template #default>
                          <span class="text-caption">{{ p.status.totalSpace ? Math.round((p.status.usedSpace / p.status.totalSpace) * 100) : 0 }}%</span>
                        </template>
                      </v-progress-linear>
                    </div>
                  </template>
                  <span v-else>—</span>
                </td>
                <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">{{ disk.model }}</td>
                <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">
                  <template v-if="disk.partitions?.length">
                    <div v-for="p in disk.partitions" :key="p.device" class="text-caption" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">
                      {{ p.device || '—' }}
                      <v-chip v-if="p.status?.mounted" size="x-small" color="green" label class="ml-2">
                        {{ $t('mounted') }}
                      </v-chip>
                    </div>
                  </template>
                  <span v-else>—</span>
                </td>
                <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">
                  <v-chip size="small" label>{{ disk.type?.toUpperCase() }}</v-chip>
                  <v-chip v-if="disk.partitions?.some((p) => p.mountpoint === '/boot')" color="onPrimary" size="x-small" class="ml-1" label>
                    {{ $t('boot') }}
                  </v-chip>
                  <v-chip v-if="disk.preclearRunning" color="onPrimary" size="x-small" class="ml-1" label>
                    {{ $t('preclear running') }}
                  </v-chip>
                </td>
                <td style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis">
                  <template v-if="disk.partitions?.length">
                    <v-chip v-for="p in disk.partitions" :key="p.device" size="small" class="mr-1 mb-1" label>
                      {{ p.filesystem || '—' }}
                    </v-chip>
                  </template>
                  <span v-else>—</span>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-container>
    </v-container>
  </v-container>

  <v-dialog v-model="formatDialog.value" max-width="400">
    <v-card class="pa-0">
      <v-card-title>{{ $t('confirm format') }}</v-card-title>
      <v-card-text>
        {{ $t('are you sure you want to format this disk?') }}
        <v-select v-model="formatDialog.filesystem" :items="filesystems" :label="$t('filesystem')" dense :rules="[(v) => !!v || $t('filesystem is required')]" class="pt-4" />
        <v-switch v-model="formatDialog.partition" :label="$t('create partition')" inset hide-details density="compact" color="green" />
        <v-switch v-model="formatDialog.wipeExisting" :label="$t('wipe existing data')" inset hide-details density="compact" color="green" />
        <v-switch v-model="formatDialog.preClearEnabled" :label="$t('preclear')" inset density="compact" color="green" />
        <template v-if="formatDialog.preClearEnabled">
          <v-select v-model="formatDialog.preClear.algorithm" :items="formatAlgorithms" :label="$t('preclear algorithm')" dense />
          <v-text-field v-model.number="formatDialog.preClear.wipes" :label="$t('number of wipes')" type="number" min="1" dense />
          <v-switch v-model="formatDialog.preClear.readCheck" :label="$t('read check after wipe')" inset hide-details density="compact" color="green" />
          <v-switch v-model="formatDialog.preClear.log" :label="$t('log preclear output')" inset hide-details density="compact" color="green" />
        </template>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn color="onPrimary" @click="formatDialog.value = false">
          {{ $t('cancel') }}
        </v-btn>
        <v-btn color="red" :disabled="!formatDialog.filesystem" @click="formatDisk(formatDialog.disk)">
          {{ $t('format') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-overlay :model-value="overlay" class="align-center justify-center">
    <v-progress-circular color="onPrimary" size="64" indeterminate></v-progress-circular>
  </v-overlay>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { showSnackbarError, showSnackbarSuccess } from '@/composables/snackbar';
import { useI18n } from 'vue-i18n';

const disks = ref([]);
const { t } = useI18n();
const emit = defineEmits(['refresh-drawer', 'refresh-notifications-badge']);
const overlay = ref(false);
const disksLoaded = ref(false);
const formatAlgorithms = ['zero', 'one-zero', 'random', 'one'];
const formatDialog = reactive({
  value: false,
  disk: null,
  filesystem: '',
  partition: true,
  wipeExisting: true,
  preClearEnabled: false,
  preClear: {
    wipes: 2,
    algorithm: 'zero',
    readCheck: false,
    log: false,
  },
});
const filesystems = ref([]);

onMounted(() => {
  getDisks();
  getFilesystems();
});

const openFormatDialog = (disk) => {
  formatDialog.value = true;
  formatDialog.disk = disk;
};

const getDisks = async () => {
  try {
    const res = await fetch('/api/v1/disks', {
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
      },
    });

    if (!res.ok) {
      const errorDetails = await res.json();
      throw new Error(`${t('disks could not be loaded')}|$| ${errorDetails.error || t('unknown error')}`);
    }

    disks.value = (await res.json()) || [];
  } catch (e) {
    const [userMessage, apiErrorMessage] = e.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    disksLoaded.value = true;
  }
};

const getDiskIcon = (type) => {
  switch (type) {
    case 'ssd':
      return 'mdi-harddisk';
    case 'hdd':
      return 'mdi-harddisk';
    case 'usb':
      return 'mdi-usb-flash-drive';
    case 'nvme':
      return 'mdi-chip';
    case 'ramdisk':
      return 'mdi-memory';
    case 'emmc':
      return 'mdi-micro-sd';
    default:
      return 'mdi-help-circle';
  }
};

const wakeDisk = async (disk) => {
  overlay.value = true;
  try {
    const res = await fetch(`/api/v1/disks/${disk.name}/wake`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
      },
    });

    if (!res.ok) {
      const errorDetails = await res.json();
      throw new Error(`${t('disk could not be woken up')}|$| ${errorDetails.error || t('unknown error')}`);
    }

    showSnackbarSuccess(t('disk successfully woken up'));
    getDisks();
  } catch (e) {
    const [userMessage, apiErrorMessage] = e.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    overlay.value = false;
  }
};

const sleepDisk = async (disk) => {
  overlay.value = true;
  try {
    const res = await fetch(`/api/v1/disks/${disk.name}/sleep`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
      },
    });

    if (!res.ok) {
      const errorDetails = await res.json();
      throw new Error(`${t('disk could not be put to sleep')}|$| ${errorDetails.error || t('unknown error')}`);
    }

    showSnackbarSuccess(t('disk successfully put to sleep'));
    getDisks();
  } catch (e) {
    const [userMessage, apiErrorMessage] = e.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    overlay.value = false;
  }
};

const formatDisk = async (disk) => {
  formatDialog.value = false;

  const formatDiskData = {
    device: formatDialog.disk.name,
    filesystem: formatDialog.filesystem,
    partition: formatDialog.partition,
    wipeExisting: formatDialog.wipeExisting,
    preClear: formatDialog.preClearEnabled
      ? {
          algorithm: formatDialog.preClear.algorithm,
          wipes: formatDialog.preClear.wipes,
          readCheck: formatDialog.preClear.readCheck,
          log: formatDialog.preClear.log,
        }
      : null
  };

  try {
    overlay.value = true;
    const res = await fetch(`/api/v1/disks/format`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formatDiskData),
    });

    if (!res.ok) {
      const errorDetails = await res.json();
      throw new Error(`${t('disk could not be formatted')}|$| ${errorDetails.error || t('unknown error')}`);
    }
    showSnackbarSuccess(t('disk formatted successfully'));

    clearFormatDialog();
    getDisks();
  } catch (e) {
    const [userMessage, apiErrorMessage] = e.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    overlay.value = false;
  }
};

const getFilesystems = async () => {
  try {
    const res = await fetch('/api/v1/disks/availablefilesystems', {
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
      },
    });

    if (!res.ok) {
      const errorDetails = await res.json();
      throw new Error(`${t('filesystems could not be loaded')}|$| ${errorDetails.error || t('unknown error')}`);
    }

    const Result = await res.json();
    filesystems.value = Result || [];
  } catch (e) {
    const [userMessage, apiErrorMessage] = e.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  }
};

const mountDisk = async (disk) => {
  overlay.value = true;
  try {
    const res = await fetch(`/api/v1/disks/${disk.name}/mount`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errorDetails = await res.json();
      throw new Error(`${t('disk could not be mounted')}|$| ${errorDetails.error || t('unknown error')}`);
    }
    showSnackbarSuccess(t('disk mounted successfully'));
    getDisks();
  } catch (e) {
    const [userMessage, apiErrorMessage] = e.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    overlay.value = false;
  }
};

const unmountDisk = async (disk) => {
  overlay.value = true;
  try {
    const res = await fetch(`/api/v1/disks/${disk.name}/unmount`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errorDetails = await res.json();
      throw new Error(`${t('disk could not be unmounted')}|$| ${errorDetails.error || t('unknown error')}`);
    }
    showSnackbarSuccess(t('disk unmounted successfully'));
    getDisks();
  } catch (e) {
    const [userMessage, apiErrorMessage] = e.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    overlay.value = false;
  }
};

const clearFormatDialog = () => {
  formatDialog.value = false;
  formatDialog.disk = null;
  formatDialog.filesystem = '';
  formatDialog.partition = true;
  formatDialog.wipeExisting = true;
};
</script>
