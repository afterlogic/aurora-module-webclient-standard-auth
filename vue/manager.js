export default {
  moduleName: 'StandardAuthWebclient',

  requiredModules: [],

  getAdminUserTabs () {
    return [
      {
        tabName: 'standardauth-accounts',
        paths: [
          'id/:id/standardauth-accounts',
          'search/:search/id/:id/standardauth-accounts',
          'page/:page/id/:id/standardauth-accounts',
          'search/:search/page/:page/id/:id/standardauth-accounts',
        ],
        title: 'STANDARDAUTHWEBCLIENT.ADMIN_PANEL_TAB_LABEL',
        component () {
          return import('./components/DbAdminSettingsPerUser')
        }
      }
    ]
  },
}
