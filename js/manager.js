'use strict';


module.exports = function (oAppData) {
	var
		_ = require('underscore'),
		
		TextUtils = require('%PathToCoreWebclientModule%/js/utils/Text.js'),
		
		App = require('%PathToCoreWebclientModule%/js/App.js'),
		ModulesManager = require('%PathToCoreWebclientModule%/js/ModulesManager.js'),
		
		Settings = require('modules/%ModuleName%/js/Settings.js')
	;
	
	Settings.init(oAppData);
	
	if (!ModulesManager.isModuleAvailable(Settings.ServerModuleName))
	{
		return null;
	}
	
	if (App.isUserNormalOrTenant())
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
						Settings.userAccountsCount(_.isArray(oParams.Response.Result) ? oParams.Response.Result.length : 0);
						Settings.accountsEmails(_.isArray(oParams.Response.Result) ? _.map(oParams.Response.Result, function (oAccount) {
							return oAccount.login || '';
						}) : 0);
					}
				});
				
				if (ModulesManager.isModuleEnabled('SecuritySettingsWebclient')) {
					ModulesManager.run('SecuritySettingsWebclient', 'registerSecuritySettingsSection', [
					  	function () {
							return require('modules/%ModuleName%/js/views/StandardAccountsSettingsFormView.js')
					  	},
					  	'%ModuleName%',
					])
				} else {
					ModulesManager.run('SettingsWebclient', 'registerSettingsTab', [
						function () { 
							return require('modules/%ModuleName%/js/views/StandardAccountsSettingsFormView.js');
						},
						Settings.HashModuleName + '-accounts',
						TextUtils.i18n('%MODULENAME%/USER_SETTINGS_TAB_LABEL')
					]);
				}
			}
		};
	}
	
	return null;
};
