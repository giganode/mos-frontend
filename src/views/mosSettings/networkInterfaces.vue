<template>
  <v-container fluid class="d-flex justify-center">
    <v-container style="width: 100%; max-width: 1920px" class="pa-0">
      <v-container col="12" fluid class="pt-0 pr-0 pl-0 pb-4">
        <v-row>
          <v-col cols="auto" class="d-flex align-center">
            <v-icon @click="$router.back()" class="mr-2">mdi-arrow-left</v-icon>
          </v-col>
          <v-col>
            <h2>{{ $t('network interfaces') }}</h2>
          </v-col>
        </v-row>
      </v-container>
      <v-container fluid class="pa-0" style="margin-bottom: 80px">
        <v-card v-for="(iface, idx) in settingsNetwork.interfaces" :key="idx" class="mb-6 pa-0">
          <v-card-title class="d-flex align-center py-3">
            {{ $t('interface') }}: {{ iface.name || $t('new interface') }}
            <v-chip v-if="iface.link_state" class="ml-2" size="small" :color="iface.link_state === 'up' ? 'green' : 'red'">{{ iface.link_state }}</v-chip>
            <v-chip v-if="iface.mac" class="ml-2" size="small">{{ iface.mac }}</v-chip>
          </v-card-title>
          <v-card-subtitle v-if="iface.adapter !== '' && iface.adapter != null && iface.adapter != undefined" class="pt-0 pb-2">{{ iface.adapter }}</v-card-subtitle>
          <v-divider class="mb-0"></v-divider>
          <v-card-text class="pt-2">
            <!-- ETHERNET -->
            <template v-if="iface.type === 'ethernet'">
              <v-switch
                v-if="iface.mac !== '' && iface.mac !== null && iface.mac !== undefined"
                :label="$t('enabled')"
                :model-value="iface.status === 'enabled'"
                @update:model-value="(val) => (iface.status = val ? 'enabled' : 'disabled')"
                :readonly="readonlyInterfaceEnabled()"
                inset
                density="compact"
                color="green"
              ></v-switch>
              <v-select
                :label="$t('type')"
                v-model="iface.type"
                :items="['ethernet', 'bridged']"
                item-title="type"
                item-value="type"
                variant="outlined"
                hide-details="auto"
                @update:model-value="changeInterfaceType(iface)"
              ></v-select>
              <v-divider class="my-4"></v-divider>
              <div class="d-flex align-center mb-4">
                <span class="text-subtitle-1 font-weight-medium">{{ $t('ipv4') }}</span>
              </div>
              <v-row v-if="iface.ipv4.length > 0">
                <v-col cols="12">
                  <v-switch :label="$t('ipv4 dhcp')" v-model="iface.ipv4[0].dhcp" inset density="compact" color="green" hide-details="auto"></v-switch>
                </v-col>
                <template v-if="!iface.ipv4[0].dhcp">
                  <v-col cols="12" md="6">
                    <v-text-field :label="$t('ipv4 address')" v-model="iface.ipv4[0].address" variant="outlined" hide-details="auto"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field :label="$t('ipv4 gateway')" v-model="iface.ipv4[0].gateway" variant="outlined" hide-details="auto"></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field :label="$t('ipv4 dns (comma separated)')" v-model="getIfaceIpDnsString(iface, 'ipv4').value" variant="outlined" hide-details="auto"></v-text-field>
                  </v-col>
                </template>
              </v-row>

              <v-divider class="my-4"></v-divider>
              <div class="d-flex align-center mb-4">
                <span class="text-subtitle-1 font-weight-medium mr-4">{{ $t('ipv6') }}</span>
                <v-switch
                  :label="$t('enable ipv6')"
                  color="green"
                  inset
                  density="compact"
                  hide-details="auto"
                  :model-value="iface.ipv6.length > 0"
                  @update:model-value="changeIPv6Enabled(iface, $event)"
                ></v-switch>
              </div>
              <v-row v-if="iface.ipv6.length > 0">
                <v-col cols="12">
                  <v-switch :label="$t('ipv6 dhcp')" v-model="iface.ipv6[0].dhcp" inset density="compact" color="green" hide-details="auto"></v-switch>
                </v-col>
                <template v-if="!iface.ipv6[0].dhcp">
                  <v-col cols="12" md="6">
                    <v-text-field :label="$t('ipv6 address')" v-model="iface.ipv6[0].address" variant="outlined" hide-details="auto"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field :label="$t('ipv6 dns (comma separated)')" v-model="getIfaceIpDnsString(iface, 'ipv6').value" variant="outlined" hide-details="auto"></v-text-field>
                  </v-col>
                </template>
              </v-row>
            </template>

            <!-- BRIDGED -->
            <template v-else-if="iface.type === 'bridged'">
              <v-switch
                v-if="iface.mac !== '' && iface.mac !== null && iface.mac !== undefined"
                :label="$t('enabled')"
                :model-value="iface.status === 'enabled'"
                @update:model-value="(val) => (iface.status = val ? 'enabled' : 'disabled')"
                :readonly="readonlyInterfaceEnabled()"
                inset
                density="compact"
                color="green"
              ></v-switch>
              <v-select
                :label="$t('type')"
                v-model="iface.type"
                :items="['ethernet', 'bridged']"
                item-title="type"
                item-value="type"
                variant="outlined"
                hide-details="auto"
                @update:model-value="changeInterfaceType(iface)"
              ></v-select>

              <v-divider class="my-4"></v-divider>
              <div class="d-flex align-center mb-4">
                <span class="text-subtitle-1 font-weight-medium">{{ $t('bridge') }}</span>
              </div>
              <v-row>
                <v-col cols="12">
                  <v-text-field :label="$t('bridge')" v-model="findBridgeForInterface(iface).name" variant="outlined" hide-details="auto"></v-text-field>
                </v-col>
              </v-row>
            </template>

            <!-- BRIDGE -->
            <template v-else-if="iface.type === 'bridge'">
              <v-switch
                v-if="iface.mac !== '' && iface.mac !== null && iface.mac !== undefined"
                :label="$t('enabled')"
                :model-value="iface.status === 'enabled'"
                @update:model-value="(val) => (iface.status = val ? 'enabled' : 'disabled')"
                :readonly="readonlyInterfaceEnabled()"
                inset
                density="compact"
                color="green"
              ></v-switch>
              <v-switch :label="$t('vlan filtering')" v-model="iface.vlan_filtering" inset density="compact" color="green" hide-details="auto"></v-switch>
              <v-divider class="my-2"></v-divider>
              <div class="d-flex align-center mb-4">
                <span class="text-subtitle-1 font-weight-medium">{{ $t('ipv4') }}</span>
              </div>
              <v-row v-if="iface.ipv4.length > 0">
                <v-col cols="12">
                  <v-switch :label="$t('ipv4 dhcp')" v-model="iface.ipv4[0].dhcp" inset density="compact" color="green" hide-details="auto"></v-switch>
                </v-col>
                <template v-if="!iface.ipv4[0].dhcp">
                  <v-col cols="12" md="6">
                    <v-text-field :label="$t('ipv4 address')" v-model="iface.ipv4[0].address" variant="outlined" hide-details="auto"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field :label="$t('ipv4 gateway')" v-model="iface.ipv4[0].gateway" variant="outlined" hide-details="auto"></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field :label="$t('ipv4 dns (comma separated)')" v-model="getIfaceIpDnsString(iface, 'ipv4').value" variant="outlined" hide-details="auto"></v-text-field>
                  </v-col>
                </template>
              </v-row>

              <v-divider class="my-4"></v-divider>
              <div class="d-flex align-center mb-4">
                <span class="text-subtitle-1 font-weight-medium mr-4">{{ $t('ipv6') }}</span>
                <v-switch
                  :label="$t('enable ipv6')"
                  color="green"
                  hide-details="auto"
                  inset
                  density="compact"
                  :model-value="iface.ipv6.length > 0"
                  @update:model-value="(val) => changeIPv6Enabled(iface, val)"
                ></v-switch>
              </div>
              <v-row v-if="iface.ipv6.length > 0">
                <v-col cols="12">
                  <v-switch :label="$t('ipv6 dhcp')" v-model="iface.ipv6[0].dhcp" inset density="compact" color="green" hide-details="auto"></v-switch>
                </v-col>
                <template v-if="!iface.ipv6[0].dhcp">
                  <v-col cols="12" md="6">
                    <v-text-field :label="$t('ipv6 address')" v-model="iface.ipv6[0].address" variant="outlined" hide-details="auto"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field :label="$t('ipv6 gateway')" v-model="iface.ipv6[0].gateway" variant="outlined" hide-details="auto"></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field :label="$t('ipv6 dns (comma separated)')" v-model="getIfaceIpDnsString(iface, 'ipv6').value" variant="outlined" hide-details="auto"></v-text-field>
                  </v-col>
                </template>
              </v-row>
            </template>
          </v-card-text>
        </v-card>
      </v-container>
    </v-container>
  </v-container>

  <!-- Accept Changed Settings -->
  <v-dialog v-model="settingsNetworkCountdown.value" persistent width="600">
    <v-card class="pa-0" :title="$t('apply network settings')">
      <v-card-text>{{ $t('your network settings were changed, do you want to keep these settings') }}?</v-card-text>
      <v-card-actions>
        <v-btn color="onPrimary" text @click="revertChanges()">{{ $t('revert') }} ({{ settingsNetworkCountdown.remaining_seconds }})</v-btn>
        <v-btn color="onPrimary" @click="acceptChanges()">{{ $t('accept') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Floating Action Button -->
  <v-fab @click="setNetworkSettings()" color="primary" style="position: fixed; bottom: 32px; right: 32px; z-index: 1000" size="large" icon>
    <v-icon>mdi-content-save</v-icon>
  </v-fab>

  <v-overlay :model-value="overlay" class="align-center justify-center">
    <v-progress-circular color="onPrimary" size="64" indeterminate></v-progress-circular>
  </v-overlay>
</template>

<script setup>
import { onMounted, ref, computed, reactive, watch, onBeforeUnmount } from 'vue';
import { showSnackbarError, showSnackbarSuccess } from '@/composables/snackbar';
import { useI18n } from 'vue-i18n';

const emit = defineEmits(['refresh-drawer', 'refresh-notifications-badge']);
const settingsNetwork = ref({ interfaces: [] });
const overlay = ref(false);
const { t } = useI18n();
const settingsNetworkCountdown = reactive({
  value: false,
  remaining_seconds: 0,
});

let countdownInterval = null;

watch(
  () => settingsNetworkCountdown.value,
  (val) => {
    if (!val && countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  },
);

onBeforeUnmount(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
});

const getIfaceIpDnsString = (iface, type) => {
  return computed({
    get() {
      return iface[type][0].dns && iface[type][0].dns.length ? iface[type][0].dns.join(', ') : '';
    },
    set(val) {
      iface[type][0].dns = val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    },
  });
};

onMounted(() => {
  getNetworkSettings();
});

const getNetworkSettings = async () => {
  try {
    const res = await fetch('/api/v1/mos/settings/network/interfaces', {
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`${t('network settings could not be loaded')}|$| ${error.error || t('unknown error')}`);
    }

    settingsNetwork.value = await res.json();
    settingsNetwork.value.interfaces.forEach((iface) => {
      if (!iface.ipv4 || iface.ipv4.length === 0) iface.ipv4 = [{ dhcp: false, address: null, gateway: null, dns: [] }];
      if (!iface.ipv6) iface.ipv6 = [];
    });
    if (settingsNetwork.value.pending_changes) {
      opensettingsNetworkCountdownDialog(settingsNetwork.value);
    }
  } catch (e) {
    const [userMessage, apiErrorMessage] = e.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  }
};

const setNetworkSettings = async () => {
  try {
    overlay.value = true;
    const res = await fetch('/api/v1/mos/settings/network/interfaces', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settingsNetwork.value.interfaces),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`${t('network settings could not be changed')}|$| ${error.error || t('unknown error')}`);
    }
    await getNetworkSettings();
    showSnackbarSuccess(t('network settings changed successfully'));
  } catch (e) {
    const [userMessage, apiErrorMessage] = e.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    overlay.value = false;
  }
};

const acceptChanges = async () => {
  settingsNetworkCountdown.value = false;
  try {
    overlay.value = true;
    const res = await fetch('/api/v1/mos/settings/network/apply', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`${t('network settings could not be accepted')}|$| ${error.error || t('unknown error')}`);
    }
    await getNetworkSettings();
    showSnackbarSuccess(t('network settings accepted successfully'));
  } catch (e) {
    const [userMessage, apiErrorMessage] = e.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    overlay.value = false;
  }
};

const revertChanges = async () => {
  settingsNetworkCountdown.value = false;
  try {
    overlay.value = true;
    const res = await fetch('/api/v1/mos/settings/network/revert', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('authToken'),
      },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(`${t('network settings could not be reverted')}|$| ${error.error || t('unknown error')}`);
    }
    await getNetworkSettings();
    showSnackbarSuccess(t('network settings reverted successfully'));
  } catch (e) {
    const [userMessage, apiErrorMessage] = e.message.split('|$|');
    showSnackbarError(userMessage, apiErrorMessage);
  } finally {
    overlay.value = false;
  }
};

const changeInterfaceType = (iface) => {
  if (iface.type === 'ethernet') {
    const bridgeIdx = settingsNetwork.value.interfaces.findIndex((i) => i.type === 'bridge' && i.interfaces.includes(iface.name));
    if (bridgeIdx !== -1) {
      settingsNetwork.value.interfaces.splice(bridgeIdx, 1);
    }
  } else if (iface.type === 'bridged') {
    const hasBridge = settingsNetwork.value.interfaces.some((i) => i.type === 'bridge');
    const bridgeName = 'br' + iface.name.slice(3);
    if (!hasBridge) {
      settingsNetwork.value.interfaces.push({
        name: bridgeName,
        type: 'bridge',
        mode: null,
        ipv4: [
          {
            dhcp: true,
            address: null,
            gateway: null,
            dns: [],
          },
        ],
        ipv6: [],
        vlan_filtering: false,
        interfaces: [iface.name],
      });
    }
  }
};
const changeIPv6Enabled = (iface, enabled) => {
  if (enabled) {
    if (!iface.ipv6) iface.ipv6 = [];
    if (iface.ipv6.length === 0) {
      iface.ipv6.push({
        dhcp: true,
        address: null,
        gateway: null,
        dns: [],
      });
    }
  } else {
    iface.ipv6 = [];
  }
};

const opensettingsNetworkCountdownDialog = (networkSettings) => {
  settingsNetworkCountdown.value = true;
  settingsNetworkCountdown.remaining_seconds = networkSettings.remaining_seconds;
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  countdownInterval = setInterval(() => {
    if (settingsNetworkCountdown.remaining_seconds > 0) {
      settingsNetworkCountdown.remaining_seconds -= 1;
    } else {
      clearInterval(countdownInterval);
      countdownInterval = null;
      settingsNetworkCountdown.value = false;
      getNetworkSettings();
    }
  }, 1000);
};

const findBridgeForInterface = (iface) => {
  return settingsNetwork.value.interfaces.find((i) => i.type === 'bridge' && i.interfaces.includes(iface.name)) || { name: '' };
};

const readonlyInterfaceEnabled = () => {
  let ifaces = settingsNetwork.value.interfaces.filter((i) => i.mac && i.mac !== '' && i.mac !== null && i.mac !== undefined);
  if (ifaces.length <= 1) return true;
  return false;
};
</script>
