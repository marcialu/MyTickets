sap.ui.define([
	"MyTickets/model/GroupSortState",
	"sap/ui/model/json/JSONModel",
	"sap/ui/thirdparty/sinon",
	"sap/ui/thirdparty/sinon-qunit"
], function(GroupSortState, JSONModel) {
	"use strict";

	QUnit.module("GroupSortState - grouping and sorting", {
		beforeEach: function() {
			this.oModel = new JSONModel({});
			// System under test
			this.oGroupSortState = new GroupSortState(this.oModel, function() {});
		}
	});

	QUnit.test("Should always return a sorter when sorting", function(assert) {
		// Act + Assert
		assert.strictEqual(this.oGroupSortState.sort("").length, 1, "The sorting by  returned a sorter");
		assert.strictEqual(this.oGroupSortState.sort("Description").length, 1, "The sorting by Description returned a sorter");
	});

	QUnit.test("Should return a grouper when grouping", function(assert) {
		// Act + Assert
		assert.strictEqual(this.oGroupSortState.group("").length, 1, "The group by  returned a sorter");
		assert.strictEqual(this.oGroupSortState.group("None").length, 0, "The sorting by None returned no sorter");
	});

	QUnit.test("Should set the sorting to  if the user groupes by ", function(assert) {
		// Act + Assert
		this.oGroupSortState.group("");
		assert.strictEqual(this.oModel.getProperty("/sortBy"), "", "The sorting is the same as the grouping");
	});

	QUnit.test("Should set the grouping to None if the user sorts by Description and there was a grouping before", function(assert) {
		// Arrange
		this.oModel.setProperty("/groupBy", "");

		this.oGroupSortState.sort("Description");

		// Assert
		assert.strictEqual(this.oModel.getProperty("/groupBy"), "None", "The grouping got reset");
	});
});