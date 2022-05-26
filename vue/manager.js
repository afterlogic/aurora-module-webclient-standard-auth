import DbAdminSettingsPerUser from './components/DbAdminSettingsPerUser'

export default {
  moduleName: 'StandardAuthWebclient',

  requiredModules: [],

  getAdminUserTabs () {
    return [
      {
        tabName: 'db-auth',
        tabTitle: 'STANDARDAUTHWEBCLIENT.ADMIN_PANEL_TAB_LABEL',
        tabRouteChildren: [
          { path: 'id/:id/db-auth', component: DbAdminSettingsPerUser },
          { path: 'search/:search/id/:id/db-auth', component: DbAdminSettingsPerUser },
          { path: 'page/:page/id/:id/db-auth', component: DbAdminSettingsPerUser },
          { path: 'search/:search/page/:page/id/:id/db-auth', component: DbAdminSettingsPerUser },
        ],
      }
    ]
  },
}
