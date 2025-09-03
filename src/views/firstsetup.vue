<template>
    <v-container>
        <v-row>
            <v-col>
                <v-card variant="tonal" fluid>
                    <v-card-title>{{ $t('first setup') }}</v-card-title>
                    <v-card-text>
                        <form @submit.prevent="doFirstSetup">
                            <v-text-field v-model="form.username" label="Username" required></v-text-field>
                            <v-text-field v-model="form.password" label="Password" type="password" required></v-text-field>
                            <button type="submit" style="display:none"></button>
                        </form>
                    </v-card-text>
                    <v-card-actions class="justify-center">
                        <v-btn color="primary" variant="outlined" @click="doFirstSetup" style="min-width: 200px;">{{
                            $t('create user') }}</v-btn>
                    </v-card-actions>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { showSnackbarError, showSnackbarSuccess } from '@/composables/snackbar';
import { useRouter } from 'vue-router';

const router = useRouter();
const { t } = useI18n();
const overlay = ref(false);
const emit = defineEmits(['setup-complete']);
const props = defineProps({
    token: String
});
const form = reactive({
    username: '',
    password: ''
});

const doFirstSetup = async () => {
    const success = await addUser();
    if (success) {
        emit('setup-complete');
    } else {
        showSnackbarError(t('Failed to create user'));
    }
};

const addUser = async () => {
    const newUser = {
        username: form.username,
        password: form.password,
        role: 'admin'
    };

    try {
        overlay.value = true;
        const res = await fetch('/api/v1/auth/users', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + props.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        });
        overlay.value = false;

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || t('Failed to create user'));
        }

        return true;

    } catch (e) {
        return false;
    }
};

</script>