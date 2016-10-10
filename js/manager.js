'use strict';


module.exports = function (oAppData) {
	var
		_ = require('underscore'),
		
		TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
		
		App = require('%PathToCoreWebclientModule%/js/App.js'),
		
		Settings = require('modules/%ModuleName%/js/Settings.js'),
		
		bAdminUser = App.getUserRole() === Enums.UserRole.SuperAdmin,
		bNormalUser = App.getUserRole() === Enums.UserRole.NormalUser
	;
	
	Settings.init();
	
	if (bAdminUser)
	{
		return {
			/**
			 * Runs after app initializing. Adds standard auth tab to admin panel.
			 * 
			 * @param {Object} ModulesManager Modules manager object.
			 */
			start: function (ModulesManager) {
				ModulesManager.run('AdminPanelWebclient', 'registerAdminPanelTab', [
					function () { return require('modules/%ModuleName%/js/views/AccountsSettingsView.js'); },
					Settings.HashModuleName + '-accounts',
					TextUtils.i18n('%MODULENAME%/LABEL_BASIC_ACCOUNTS_TAB')
				]);
			}
		};
	}
	
	if (bNormalUser)
	{
		return {
			/**
			 * Runs after app initializing. Adds standard auth tab to user settings.
			 * 
			 * @param {Object} ModulesManager Modules manager object.
			 */
			start: function (ModulesManager) {
				App.subscribeEvent('ReceiveAjaxResponse::after', function (oParams) {
					if (oParams.Request.Module === Settings.ServerModuleName && oParams.Request.Method === 'GetUserAccounts')
					{
						Settings.userAccountsCount(_.isArray(oParams.MainResponse.Result) ? oParams.MainResponse.Result.length : 0);
					}
				});
				
				ModulesManager.run('SettingsWebclient', 'registerSettingsTab', [
					function () { return require('modules/%ModuleName%/js/views/AccountsSettingsView.js'); },
					Settings.HashModuleName + '-accounts',
					TextUtils.i18n('%MODULENAME%/LABEL_BASIC_ACCOUNTS_TAB')
				]);
			}
		};
	}
	
	return null;
};
