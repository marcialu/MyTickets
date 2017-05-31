/*global location */
sap.ui.define([
	"MyTickets/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"MyTickets/model/formatter",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], function(BaseController, JSONModel, formatter, MessageBox, MessageToast) {
	"use strict";

	return BaseController.extend("MyTickets.controller.Feedback", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.setModel(oViewModel, "detailView");
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			this._oODataModel = this.getOwnerComponent().getModel();
			this._oResourceBundle = this.getResourceBundle();
		},
		
		/**
		 * Event handler (attached declaratively) for the view save button. Saves the changes added by the user. 
		 * @function
		 * @public
		 */
		onSave: function() {
			
			var that = this,
				oModel = this.getModel();
				
			if (!oModel.hasPendingChanges()) {
				MessageBox.information(
					this._oResourceBundle.getText("noChangesMessage"), {
						id: "noChangesInfoMessageBox",
						styleClass: that.getOwnerComponent().getContentDensityClass()
					}
				);
				return;
			}
			
			oModel.attachEventOnce("batchRequestCompleted", function(oEvent) {
				if (that._checkIfBatchRequestSucceeded(oEvent)) {
					that._fnUpdateSuccess();
				} else {
					that._fnEntityCreationFailed();
					MessageBox.error(that._oResourceBundle.getText("updateError"));
				}
			});
			oModel.submitChanges();
		},

		_checkIfBatchRequestSucceeded: function(oEvent) {
			var oParams = oEvent.getParameters();
			var aRequests = oEvent.getParameters().requests;
			var oRequest;
			if (oParams.success) {
				if (aRequests) {
					for (var i = 0; i < aRequests.length; i++) {
						oRequest = oEvent.getParameters().requests[i];
						if (!oRequest.success) {
							return false;
						}
					}
				}
				return true;
			} else {
				return false;
			}
		},
		
		/**
		 * Event handler (attached declaratively) for the view cancel button. Asks the user confirmation to discard the changes. 
		 * @function
		 * @public
		 */
		onCancel: function(oEvent) {
			var that = this;
			
			var oItem = oEvent.getParameter("listItem") || oEvent.getSource();
			var fnLeave = function() {
				that._oODataModel.resetChanges();
				that._showDetail(oItem);
			};
			
			if (this._oODataModel.hasPendingChanges()) {
				//pending changes, ask user what he wants to do
				var sQuestion = this.getResourceBundle().getText("warningConfirm");
				var sTitle = this.getResourceBundle().getText("warning");
	
				MessageBox.show(sQuestion, {
					icon: MessageBox.Icon.WARNING,
					title: sTitle,
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					onClose: function(oAction) {
						if (oAction === MessageBox.Action.OK) {
							//reset the changes and reload ticket information
							fnLeave();
						} else {
							//no changes, so do nothing
						}
					}
			});
			} else {
				//no pending changes, so do nothing
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var oParameter = oEvent.getParameter("arguments");
			for (var value in oParameter) {
				oParameter[value] = decodeURIComponent(oParameter[value]);
			}
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("TICKETMYSet", oParameter);
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		/**
		 * Event handler for binding change event
		 * @function
		 * @private
		 */

		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding(),
				oViewModel = this.getModel("detailView"),
				oAppViewModel = this.getModel("appView");

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getBoundContext().getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.TicketId,
				sObjectName = oObject.Description;

			oViewModel.setProperty("/sObjectId", sObjectId);
			oViewModel.setProperty("/sObjectPath", sPath);
			oAppViewModel.setProperty("/itemToSelect", sPath);
			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		/**
		 * Event handler for metadata loaded event
		 * @function
		 * @private
		 */

		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		/**
		 * Opens a dialog letting the user either confirm or cancel the deletion of a list of entities
		 * @param {object} oConfirmation - Possesses up to two attributes: question (obligatory) is a string providing the statement presented to the user.
		 * title (optional) may be a string defining the title of the popup.
		 * @param {object} oConfirmation - Possesses up to two attributes: question (obligatory) is a string providing the statement presented to the user.
		 * @param {array} aPaths -  Array of strings representing the context paths to the entities to be deleted. Currently only one is supported.
		 * @param {callback} fnAfterDeleted (optional) - called after deletion is done. 
		 * @param {callback} fnDeleteCanceled (optional) - called when the user decides not to perform the deletion
		 * @param {callback} fnDeleteConfirmed (optional) - called when the user decides to perform the deletion. A Promise will be passed
		 * @function
		 * @private
		 */
		/* eslint-disable */ // using more then 4 parameters for a function is justified here
		_confirmDeletionByUser: function(oConfirmation, aPaths, fnAfterDeleted, fnDeleteCanceled, fnDeleteConfirmed) {
			/* eslint-enable */
			// Callback function for when the user decides to perform the deletion
			var fnDelete = function() {
				// Calls the oData Delete service
				this._callDelete(aPaths, fnAfterDeleted);
			}.bind(this);

			// Opens the confirmation dialog
			MessageBox.show(oConfirmation.question, {
				icon: oConfirmation.icon || MessageBox.Icon.WARNING,
				title: oConfirmation.title || this._oResourceBundle.getText("delete"),
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				onClose: function(oAction) {
					if (oAction === MessageBox.Action.OK) {
						fnDelete();
					} else if (fnDeleteCanceled) {
						fnDeleteCanceled();
					}
				}
			});
		},

		/**
		 * Performs the deletion of a list of entities.
		 * @param {array} aPaths -  Array of strings representing the context paths to the entities to be deleted. Currently only one is supported.
		 * @param {callback} fnAfterDeleted (optional) - called after deletion is done. 
		 * @return a Promise that will be resolved as soon as the deletion process ended successfully.
		 * @function
		 * @private
		 */
		_callDelete: function(aPaths, fnAfterDeleted) {
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/busy", true);
			var fnFailed = function() {
				this._oODataModel.setUseBatch(true);
			}.bind(this);
			var fnSuccess = function() {
				if (fnAfterDeleted) {
					fnAfterDeleted();
					this._oODataModel.setUseBatch(true);
				}
				oViewModel.setProperty("/busy", false);
			}.bind(this);
			return this._deleteOneEntity(aPaths[0], fnSuccess, fnFailed);
		},

		/**
		 * Deletes the entity from the odata model
		 * @param {array} aPaths -  Array of strings representing the context paths to the entities to be deleted. Currently only one is supported.
		 * @param {callback} fnSuccess - Event handler for success operation.
		 * @param {callback} fnFailed - Event handler for failure operation.
		 * @function
		 * @private
		 */
		_deleteOneEntity: function(sPath, fnSuccess, fnFailed) {
			var oPromise = new Promise(function(fnResolve, fnReject) {
				this._oODataModel.setUseBatch(false);
				this._oODataModel.remove(sPath, {
					success: fnResolve,
					error: fnReject,
					async: true
				});
			}.bind(this));
			oPromise.then(fnSuccess, fnFailed);
			return oPromise;
		}

	});
});