<template>
  <q-scroll-area class="full-height full-width">
    <div class="q-pa-lg">
      <div class="row q-mb-md">
        <div class="col text-h5">{{$t('STANDARDAUTHWEBCLIENT.USER_SETTINGS_TAB_HEADING') }}</div>
      </div>
      <q-card flat bordered class="card-edit-settings">
        <q-card-section>
          <div class="row q-pb-md">
            <div class="col-2">
              <div class="q-my-sm">
                {{ $t('COREWEBCLIENT.LABEL_LOGIN') }}
              </div>
            </div>
            <div class="col-5">
                <q-input outlined dense class="q-ml-sm" bg-color="white" v-model="login" disable/>
            </div>
          </div>
          <div class="row q-pb-md">
            <div class="col-2">
              <div class="q-my-sm">
                {{ $t('COREWEBCLIENT.LABEL_PASSWORD') }}
              </div>
            </div>
            <div class="col-5">
                <q-input outlined dense class="q-ml-sm" bg-color="white" type="password" autocomplete="new-password"
                         v-model="password" ref="password" />
            </div>
          </div>
          <div class="row">
            <div class="col-2">
              <div class="q-my-sm">
                {{ $t('STANDARDAUTHWEBCLIENT.LABEL_CONFIRM_PASS') }}
              </div>
            </div>
            <div class="col-5">
                <q-input outlined dense class="q-ml-sm" bg-color="white" type="password" autocomplete="new-password"
                         v-model="confirmPassword" ref="confirmPassword" />
            </div>
          </div>
        </q-card-section>
      </q-card>
      <div v-if="!hasAccount" class="q-pt-md text-right">
        <q-btn unelevated no-caps dense class="q-px-sm" :ripple="false" color="primary"
               :label="$t('COREWEBCLIENT.ACTION_SAVE')"
               @click="createSettingsForEntity"/>
      </div>
      <div v-if="hasAccount" class="q-pt-md text-right">
        <q-btn unelevated no-caps dense class="q-px-sm" :ripple="false" color="primary"
               :label="$t('COREWEBCLIENT.ACTION_SAVE')"
               @click="updateSettingsForEntity"/>
      </div>
    </div>
    <component v-for="component in additionalComponents" :key="component.name" v-bind:is="component"
               :user="user" :loading="loading" />
    <q-inner-loading style="justify-content: flex-start;" :showing="loading || saving">
      <q-linear-progress query />
    </q-inner-loading>
  </q-scroll-area>
</template>

<script>
import _ from 'lodash'

import errors from 'src/utils/errors'
import notification from 'src/utils/notification'
import typesUtils from 'src/utils/types'
import webApi from 'src/utils/web-api'

import cache from 'src/cache'
import eventBus from 'src/event-bus'

const FAKE_PASS = '     '

export default {
  name: 'DbAdminSettingsPerUser',

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
      hasAccount: false,

      additionalComponents: [],
    }
  },

  watch: {
    $route (to, from) {
      this.parseRoute()
    },
  },

  async mounted () {
    this.parseRoute()
    const params = {
      components: []
    }
    eventBus.$emit('DbAdminSettingsPerUser::GetAdditionalComponents', params)
    const additionalComponents = []
    for (const componentPromise of params.components) {
      const component = await componentPromise
      if (component?.default) {
        additionalComponents.push(component.default)
      }
    }
    this.additionalComponents = additionalComponents
  },

  beforeRouteLeave (to, from, next) {
    this.doBeforeRouteLeave(to, from, next)
  },

  methods: {
    /**
     * Method is used in doBeforeRouteLeave mixin
     */
    hasChanges () {
      return this.password !== this.savedPass ||
          this.savedConfirmPass !== this.confirmPassword
    },

    /**
     * Method is used in doBeforeRouteLeave mixin,
     * do not use async methods - just simple and plain reverting of values
     * !! hasChanges method must return true after executing revertChanges method
     */
    revertChanges () {
      this.password = this.savedPass
      this.confirmPassword = this.savedConfirmPass
    },

    isDataValid () {
      const password = _.trim(this.password)
      if (password === '') {
        notification.showError(this.$t('COREWEBCLIENT.ERROR_REQUIRED_FIELDS_EMPTY'))
        this.$refs.password.focus()
        return false
      }
      if (password !== _.trim(this.confirmPassword)) {
        notification.showError(this.$t('COREWEBCLIENT.ERROR_PASSWORDS_DO_NOT_MATCH'))
        this.$refs.confirmPassword.focus()
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
      const currentTenantId = this.$store.getters['tenants/getCurrentTenantId']
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
      if (!this.saving && this.isDataValid()) {
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
    },
    createSettingsForEntity () {
      if (!this.saving && this.isDataValid()) {
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
