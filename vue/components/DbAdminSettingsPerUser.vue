<template>
  <q-scroll-area class="full-height full-width">
    <div class="q-pa-lg" v-if="!loading">
      <div class="row q-mb-md">
        <div class="col text-h5">{{$t('STANDARDAUTHWEBCLIENT.USER_SETTINGS_TAB_HEADING') }}</div>
      </div>
      <q-card flat bordered class="card-edit-settings">
        <q-card-section>
          <div v-if="!hasAccount" class="row q-mb-md">
            <div class="col text-h6">{{ $t('STANDARDAUTHWEBCLIENT.HEADING_CREATE_FIRST_ACCOUNT') }}</div>
          </div>
          <div v-else class="row q-mb-md">
            <div class="col text-h6">{{ $t('STANDARDAUTHWEBCLIENT.HEADING_EDIT_NEW_ACCOUNT') }}</div>
          </div>
          <div class="row q-pb-md">
            <div class="col-1">
              <div class="q-my-sm">
                {{ $t('COREWEBCLIENT.LABEL_LOGIN') }}
              </div>
            </div>
            <div class="col-5">
                <q-input outlined dense class="bg-white q-ml-sm" v-model="login" disable/>
            </div>
          </div>
          <div class="row q-pb-md">
            <div class="col-1">
              <div class="q-my-sm">
                {{ $t('COREWEBCLIENT.LABEL_PASSWORD') }}
              </div>
            </div>
            <div class="col-5">
                <q-input outlined dense class="bg-white q-ml-sm" ref="password" type="password" v-model="password"/>
            </div>
          </div>
          <div class="row q-pb-md">
            <div class="col-1">
              <div class="q-my-sm">
                {{ $t('STANDARDAUTHWEBCLIENT.LABEL_CONFIRM_PASS') }}
              </div>
            </div>
            <div class="col-5">
                <q-input outlined dense class="bg-white q-ml-sm" ref="confirmPassword" type="password" v-model="confirmPassword"/>
            </div>
          </div>
        </q-card-section>
      </q-card>
      <div v-if="!hasAccount" class="q-pt-md text-right">
        <q-btn unelevated no-caps dense class="q-px-sm" :ripple="false" color="primary"
               :label="saving ? $t('STANDARDAUTHWEBCLIENT.ACTION_CREATE_IN_PROGRESS') : $t('STANDARDAUTHWEBCLIENT.ACTION_CREATE')"
               @click="createSettingsForEntity"/>
      </div>
      <div v-if="hasAccount" class="q-pt-md text-right">
        <q-btn unelevated no-caps dense class="q-px-sm" :ripple="false" color="primary"
               :label="saving ? $t('STANDARDAUTHWEBCLIENT.ACTION_UPDATE_IN_PROGRESS') : $t('STANDARDAUTHWEBCLIENT.ACTION_UPDATE')"
               @click="updateSettingsForEntity"/>
      </div>
    </div>
    <q-inner-loading style="justify-content: flex-start;" :showing="loading || saving">
      <q-linear-progress query class="q-mt-sm" />
    </q-inner-loading>
    <UnsavedChangesDialog ref="unsavedChangesDialog"/>
  </q-scroll-area>
</template>

<script>
import _ from 'lodash'

import errors from 'src/utils/errors'
import notification from 'src/utils/notification'
import typesUtils from 'src/utils/types'
import webApi from 'src/utils/web-api'

import cache from 'src/cache'
import core from 'src/core'

import UnsavedChangesDialog from 'src/components/UnsavedChangesDialog'

const FAKE_PASS = '     '

export default {
  name: 'DbAdminSettingsPerUser',
  components: {
    UnsavedChangesDialog
  },
  data () {
    return {
      user: null,
      password: '',
      savedPass: '',
      savedConfirmPass: '',
      confirmPassword: '',
      login: '',
      loading: false,
      saving: false,
      hasAccount: false
    }
  },
  watch: {
    $route (to, from) {
      this.parseRoute()
    },
  },
  mounted () {
    this.parseRoute()
  },
  beforeRouteLeave (to, from, next) {
    if (this.hasChanges() && _.isFunction(this?.$refs?.unsavedChangesDialog?.openConfirmDiscardChangesDialog)) {
      this.$refs.unsavedChangesDialog.openConfirmDiscardChangesDialog(next)
    } else {
      next()
    }
  },
  methods: {
    hasChanges () {
      return this.password !== this.savedPass ||
          this.savedConfirmPass !== this.confirmPassword
    },
    isDataValid () {
      const password = _.trim(this.password)
      if (password === '') {
        notification.showError(this.$t('COREWEBCLIENT.ERROR_REQUIRED_FIELDS_EMPTY'))
        this.$refs.password.focus()
        return false
      }
      return true
    },
    parseRoute () {
      const userId = typesUtils.pPositiveInt(this.$route?.params?.id)
      if (this.user?.id !== userId) {
        this.user = {
          id: userId,
        }
        this.populate()
      }
    },
    populate () {
      this.loading = true
      const currentTenantId = core.getCurrentTenantId()
      cache.getUser(currentTenantId, this.user.id).then(({ user, userId }) => {
        this.loading = false
        if (userId === this.user.id) {
          if (user && _.isFunction(user?.getData)) {
            this.user = user
            this.login = user.getData('PublicId')
            this.getUserAccounts()
          } else {
            this.$emit('no-user-found')
          }
        }
      })
    },
    updateSettingsForEntity () {
      if (this.isDataValid()) {
        if (this.password !== this.confirmPassword) {
          notification.showError(this.$t('COREWEBCLIENT.ERROR_PASSWORDS_DO_NOT_MATCH'))
        } else {
          if (!this.saving) {
            this.saving = true
            const parameters = {
              AccountId: this.account?.id,
              TenantId: this.user.tenantId,
              Password: this.password,
            }
            webApi.sendRequest({
              moduleName: 'StandardAuth',
              methodName: 'UpdateAccount',
              parameters
            }).then(result => {
              this.saving = false
              if (result) {
                this.savedPass = this.password
                this.savedConfirmPass = this.password
                this.populate()
                notification.showReport(this.$t('COREWEBCLIENT.REPORT_SETTINGS_UPDATE_SUCCESS'))
              } else {
                notification.showError(this.$t('COREWEBCLIENT.ERROR_SAVING_SETTINGS_FAILED'))
              }
            }, response => {
              this.saving = false
              notification.showError(errors.getTextFromResponse(response, this.$t('COREWEBCLIENT.ERROR_SAVING_SETTINGS_FAILED')))
            })
          }
        }
      }
    },
    createSettingsForEntity () {
      if (this.isDataValid()) {
        if (this.password !== this.confirmPassword) {
          notification.showError(this.$t('COREWEBCLIENT.ERROR_PASSWORDS_DO_NOT_MATCH'))
        } else {
          if (!this.saving) {
            this.saving = true
            const parameters = {
              Login: this.login,
              TenantId: this.user.tenantId,
              Password: this.password,
            }
            webApi.sendRequest({
              moduleName: 'StandardAuth',
              methodName: 'CreateAuthenticatedUserAccount',
              parameters
            }).then(result => {
              this.saving = false
              if (result) {
                this.savedPass = this.password
                this.savedConfirmPass = this.password
                this.populate()
                notification.showReport(this.$t('COREWEBCLIENT.REPORT_SETTINGS_UPDATE_SUCCESS'))
              } else {
                notification.showError(this.$t('COREWEBCLIENT.ERROR_SAVING_SETTINGS_FAILED'))
              }
            }, response => {
              this.saving = false
              notification.showError(errors.getTextFromResponse(response, this.$t('COREWEBCLIENT.ERROR_SAVING_SETTINGS_FAILED')))
            })
          }
        }
      }
    },
    getUserAccounts () {
      this.loading = true
      const parameters = {
        UserId: this.user?.id,
        TenantId: this.user?.tenantId,
      }
      webApi.sendRequest({
        moduleName: 'StandardAuth',
        methodName: 'GetUserAccounts',
        parameters
      }).then(result => {
        this.loading = false
        if (result.length) {
          if (!this.confirmPassword) {
            this.password = FAKE_PASS
            this.savedPass = FAKE_PASS
          }
          this.hasAccount = true
          this.account = result.find(account => account.login === this.user.publicId)
        } else {
          this.hasAccount = false
        }
        this.loading = false
      })
    }
  }
}
</script>