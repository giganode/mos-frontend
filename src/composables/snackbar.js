// composables/snackbar.js
import { ref } from 'vue'
import { toast } from 'vue-sonner'

/**
 * @typedef {'top left'|'top center'|'top right'|'bottom left'|'bottom center'|'bottom right'} SnackbarPosition
 * @typedef {'success'|'error'|'warning'|'info'|string} SnackbarColor
 */

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('info')
const snackbarIcon = ref('')
const snackbarApiError = ref('')
const snackbarShowErrorDetails = ref(false)
const snackbarPosition = ref('bottom center')

export function showSnackbarSuccess(
  text,
  icon = 'mdi-success',
  position = 'bottom center',
  duration = 3000
) {
  snackbarText.value = text
  snackbarColor.value = 'success'
  snackbar.value = true
  snackbarIcon.value = icon
  snackbarApiError.value = ''
  snackbarPosition.value = position
  snackbarShowErrorDetails.value = false
  toast.success(text, { duration })
}

export function showSnackbarError(
  text,
  errorText = '',
  icon = 'mdi-error',
  position = 'bottom center',
  durationWhenNoDetails = 3000
) {
  snackbarText.value = text
  snackbarColor.value = 'error'
  snackbar.value = true
  snackbarIcon.value = icon
  snackbarApiError.value = errorText
  snackbarShowErrorDetails.value = false
  snackbarPosition.value = position

  toast.error(text, {
    description: errorText || undefined,
    duration: errorText ? Infinity : durationWhenNoDetails,
    cancel: { label: 'Close' },
  })
}

export function useSnackbar() {
  return {
    snackbar,
    snackbarText,
    snackbarColor,
    snackbarIcon,
    snackbarApiError,
    snackbarShowErrorDetails,
    snackbarPosition,
  }
}
