<template>
  <v-container fluid class="d-flex justify-center">
    <v-container style="width: 100%; max-width: 1920px;" class="pa-0">
      <v-container col="12" fluid class="pt-0 pr-0 pl-0 pb-4">
        <h2>{{ $t('remote mounting') }}</h2>
      </v-container>
      <v-container fluid class="pa-0">

      </v-container>
    </v-container>
  </v-container>

  <v-overlay :model-value="overlay" class="align-center justify-center">
    <v-progress-circular color="primary" size="64" indeterminate></v-progress-circular>
  </v-overlay>

</template>

<script setup>
import { ref, onMounted } from 'vue';
import { showSnackbarError, showSnackbarSuccess } from '@/composables/snackbar';


const emit = defineEmits(['refresh-drawer']);
const overlay = ref(false);
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

onMounted(() => {

});


</script>
