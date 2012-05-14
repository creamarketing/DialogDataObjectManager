jQuery(document).ready(function() {
	// Re-bind submit method for forms to not submit forms via normal submit events
	// (for example by pressing enter in a text field).
	// Forms will be submitted via ajax in popup dialogs.
	jQuery('form').unbind('submit').submit(function() {
		return false;
	});
	
	// open dialog-tabsets (if one is present)
	var tabSet = jQuery('div.dialogtabset');
	var currentTabID = null, currentTabIndex = 0, maxTabIndex = 1;
	tabSet.tabs({
		create: function (){
			top.TabChangedTo('first');
		},
		show: function(event, ui) {
			top.SetIframeHeight();
			currentTabID = jQuery(ui.panel).attr('id');
			currentTabIndex = ui.index;
			initializeValidation();			
		},
		select: function(event, ui) {
			var maxTabs = tabSet.tabs('length');
			var currentSelected = ui.index;
			
			if (!validateCurrentTab('#' + currentTabID))
				return false;
					
			// Trying to select way too far ahead?
			if (currentSelected > maxTabIndex) {
				tabSet.tabs('select', maxTabIndex);
				return false;
			} 
			else {
				// Update max step if needed
				if (maxTabIndex <= currentSelected)
					maxTabIndex = currentSelected+1;
			}
			
			// Report our current position to our parent (out of iframe)
			var position = 'middle';
			if (currentSelected == 0)
				position = 'first';
			else if (currentSelected == maxTabs-1)
				position = 'last';			

			top.TabChangedTo(position);
			return true;
		}
	});
	
	// trigger the custom dialogLoaded event
	jQuery(document).trigger('dialogLoaded');
});


function gotoNextTab() {
	var tabSet = jQuery('div.dialogtabset');
	var currentSelected = tabSet.tabs('option', 'selected');
	var maxTabs = tabSet.tabs('length');
	var nextTab = currentSelected + 1;
	
	if (nextTab >= maxTabs)
		nextTab = maxTabs-1;
	
	tabSet.tabs('select', nextTab);
}

function gotoPrevTab() {
	var tabSet = jQuery('div.dialogtabset');
	var currentSelected = tabSet.tabs('option', 'selected');
	var maxTabs = tabSet.tabs('length');
	var nextTab = currentSelected - 1;
	
	if (nextTab < 0)
		nextTab = 0;
	
	tabSet.tabs('select', nextTab);
}

function isLastTabValid() {
	var lastTab = jQuery('div.dialogtabset div.tab:last');
	
	return validateCurrentTab('#' + lastTab.attr('id'));
}

// initialize validation rules
var validationRules = {}

function initializeValidation() {
	var form = jQuery('div.dialogtabset').closest('form');
	for (var key in validationRules) {
		jQuery(key).valid8(validationRules[key]);
	}
}

function validateCurrentTab(tabID) {
	// validate currently selected tab
	var currSelected = jQuery(tabID);
	var form = currSelected.closest('form');
	
	var tabOK = true;
	for (var key in validationRules) {
		var element = jQuery(key, currSelected);
		if (!element.isValid()) {
			tabOK = false;
		}
		
		element.forceRedraw();
	}

	return tabOK;
}

/*validationRules['input[name=CourseCode]'] = '';
validationRules['input[name=TermID] + input.AdvancedDropdown'] = '';
validationRules['input.date'] = { 
	'regularExpressions': [
		{ expression: /^\d\d?.\d\d?.\d\d\d\d$/, errormessage: '' }
	]
};
*/