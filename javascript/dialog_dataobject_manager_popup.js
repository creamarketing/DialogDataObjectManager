jQuery(document).ready(function() {
	// Re-bind submit method for forms to not submit forms via normal submit events
	// (for example by pressing enter in a text field).
	// Forms will be submitted via ajax in popup dialogs.
	jQuery('form').unbind('submit').submit(function() {
		return false;
	});
	
	// open dialog-tabsets (if one is present)
	var tabSet = jQuery('div.dialogtabset');
	tabSet.tabs({
		show: function() {
			top.SetIframeHeight();
		}
	});
	
	// trigger the custom dialogLoaded event
	jQuery(document).trigger('dialogLoaded');
});
