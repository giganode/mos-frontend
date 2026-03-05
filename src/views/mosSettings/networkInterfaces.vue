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
          <v-card-title class="d-flex align-center py-3">{{ $t('interface') }}: {{ iface.name || $t('new interface') }}</v-card-title>
          <v-card-text class="pt-2">
            <!-- ETHERNET -->
            <template v-if="iface.type === 'ethernet'">
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
            <template v-else-if="iface.type === 'bridged'" v-for="(bridge, bIdx) in settingsNetwork.interfaces.filter((i) => ['bridge'].includes(i.type))" :key="bIdx">
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
                  <v-text-field :label="$t('bridge')" v-model="bridge.name" variant="outlined" hide-details="auto"></v-text-field>
                </v-col>
              </v-row>
            </template>

            <!-- BRIDGE -->
            <template v-else-if="iface.type === 'bridge'" v-for="(bridge, b1Idx) in settingsNetwork.interfaces.filter((i) => ['bridge'].includes(i.type))" :key="b1Idx">
              <div class="d-flex align-center mb-4">
                <span class="text-subtitle-1 font-weight-medium">{{ $t('ipv4') }}</span>
              </div>
              <v-row v-if="bridge.ipv4.length > 0">
                <v-col cols="12">
                  <v-switch :label="$t('ipv4 dhcp')" v-model="bridge.ipv4[0].dhcp" inset density="compact" color="green" hide-details="auto"></v-switch>
                </v-col>
                <template v-if="!bridge.ipv4[0].dhcp">
                  <v-col cols="12" md="6">
                    <v-text-field :label="$t('ipv4 address')" v-model="bridge.ipv4[0].address" variant="outlined" hide-details="auto"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field :label="$t('ipv4 gateway')" v-model="bridge.ipv4[0].gateway" variant="outlined" hide-details="auto"></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field :label="$t('ipv4 dns (comma separated)')" v-model="getIfaceIpDnsString(bridge, 'ipv4').value" variant="outlined" hide-details="auto"></v-text-field>
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
                  :model-value="bridge.ipv6.length > 0"
                  @update:model-value="changeIPv6Enabled(bridge, $event)"
                ></v-switch>
              </div>
              <v-row v-if="bridge.ipv6.length > 0">
                <v-col cols="12">
                  <v-switch :label="$t('ipv6 dhcp')" v-model="bridge.ipv6[0].dhcp" inset density="compact" color="green" hide-details="auto"></v-switch>
                </v-col>
                <template v-if="!bridge.ipv6[0].dhcp">
                  <v-col cols="12" md="6">
                    <v-text-field :label="$t('ipv6 address')" v-model="bridge.ipv6[0].address" variant="outlined" hide-details="auto"></v-text-field>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-text-field :label="$t('ipv6 gateway')" v-model="bridge.ipv6[0].gateway" variant="outlined" hide-details="auto"></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field :label="$t('ipv6 dns (comma separated)')" v-model="getIfaceIpDnsString(bridge, 'ipv6').value" variant="outlined" hide-details="auto"></v-text-field>
                  </v-col>
                </template>
              </v-row>
            </template>
          </v-card-text>
        </v-card>
      </v-container>
    </v-container>
  </v-container>

  <!-- Floating Action Button -->
  <v-fab @click="setNetworkSettings()" color="primary" style="position: fixed; bottom: 32px; right: 32px; z-index: 1000" size="large" icon>
    <v-icon>mdi-content-save</v-icon>
  </v-fab>

  <v-overlay :model-value="overlay" class="align-center justify-center">
    <v-progress-circular color="onPrimary" size="64" indeterminate></v-progress-circular>
  </v-overlay>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue';
import { showSnackbarError, showSnackbarSuccess } from '@/composables/snackbar';
import { useI18n } from 'vue-i18n';

const emit = defineEmits(['refresh-drawer', 'refresh-notifications-badge']);
const settingsNetwork = ref({ interfaces: [] });
const overlay = ref(false);
const { t } = useI18n();

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

    showSnackbarSuccess(t('network settings changed successfully'));
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
</script>
