(function($) {

$.fn.DataObjectManager = function() {
	this.each(function() {
		$.fn.DataObjectManager.init(this);
	});
};

$.fn.DataObjectManager.init = function(obj) {
		var $container = $(obj);
		var container_id = '#'+$container.attr('id');
		var nested = $('.DataObjectManager').hasClass('isNested');
		
		// Popup dialog
		var isModal = false;
		// For Nested DOMs
		if(nested) {
			// TODO: add configuration support for using non-modal nested dialogs
			isModal = true;
		}
		// For normal DOMs
		else {
			isModal = true;
		}
		
		// popup links (add and edit)
  		$container.find('a.popup-button').unbind('click').click(function(e) {
			// show jQuery dialog (in top document context, we might be inside an iframe here)
			if ($(this).hasClass('wizard-mode'))
				top.ShowWizardDialog($container.attr('id'), $(this).attr('href'), $(this).attr('title'), isModal);
			else
				top.ShowDialog($container.attr('id'), $(this).attr('href'), $(this).attr('title'), isModal);
			
			// Important! Remember to stop event propagation and to return false, otherwise the default event will fire!
  			e.stopPropagation();
  			return false;
  		});
		
		// Delete
    	$deletes = $container.find('a.delete-link');
		$deletes.unbind('click').click(function(e) {
	  		$('.delete_dialog').remove();
	  		params = $('#SecurityID') ? {'forceajax' : '1', 'SecurityID' : $('#SecurityID').attr('value')} : {'forceajax' : '1'};
	    	$target = $(this);
	
			var deleteText = ss.i18n._t('DialogDataObjectManager.DELETE', 'Delete?');
			if($(this).attr('rel') == "confirm") {
				$div = $('<div class="delete_dialog">'
				           +deleteText
				           +' <a class="yes" href="javascript:void(0)"><img src="dataobject_manager/images/accept.png" alt="yes" /></a> '
				           +' <a class="no" href="javascript:void(0)"><img src="dataobject_manager/images/cancel.png" alt="no"/></a> '
				       +'</div>'
				).click(function(e) {return false;e.stopPropagation()});
				
				$(this).parents('div:first').append($div);
				height = $(this).parents('li').height();
				$(this).parents('li').css({
				'height' : height+'px',
				'overflow' : 'visible'
				});
				$div.fadeIn("slow");
				$div.find('.yes').click(function(e) {
				$.post($target.attr('href'),params,function() {$($target).parents('li:first').fadeOut();$(".ajax-loader").hide();});		  
					e.stopPropagation();
				return false;
				});
				$div.find('.no').click(function(e) {
					$(this).parent().remove().parents('li').css({
						'height' : 'auto',
						'overflow' : 'hidden'
					});
					e.stopPropagation();
					return false;
				});
			}
			else {
	  			$.post($target.attr('href'),params,function() {$($target).parents('li:first').fadeOut();$(".ajax-loader").hide();});
	      	}
			return false;
		});
		
		// Refresh
		
		$container.find('a.refresh-button').unbind('click').click(function(e) {
			$t = $(this);
			$.post($t.attr('href'),{},function() {
				refresh($container, $container.attr('href'));
			});
			return false;
		});
				

		// Pagination
		$container.find('.Pagination a').unbind('click').click(function() {
			refresh($container, $(this).attr('href'));
			return false;
		});
		
		// View
		if($container.hasClass('FileDataObjectManager') && !$container.hasClass('ImageDataObjectManager')) {
			$container.find('a.viewbutton').unbind('click').click(function() {
				refresh($container, $(this).attr('href'));
				return false;
			});
		}
		
		

		// Sortable
		$container.find('.sort-control input').unbind('click').click(function(e) {
			refresh($container, $(this).attr('value'));
			$(this).attr('disabled', true);
			e.stopPropagation();
		});
		$container.find("ul[class^='sortable-']").sortable({
			update : function(e) {
				$list = $(this);
				do_class = $.trim($list.attr('class').replace('sortable-','').replace('ui-sortable',''));
				type = $container.hasClass('ManyMany') ? $container.find('input[name=controllerID]').val() : '';
				$.post('DataObjectManager_Controller/dosort/'+do_class+'/'+type, $list.sortable("serialize"));
				e.stopPropagation();
			},
			items : 'li:not(.head)',
			containment : 'document',
			tolerance : 'intersect',
			handle : ($('.list-holder').hasClass('grid') ? '.handle' : null)
		});
		
		// Click function for the LI
		if ($container.hasClass('ManyMany')) {
			// toggle the checkbox mark for many-many
			$container.find('ul:not(.ui-sortable) li.data').unbind('click').click(function(e){
				$(this).find(':checkbox').click();
				e.stopPropagation();
			}).css({
				'cursor': 'pointer'
			});
		}
		else {
			// click the first popup-button for normal DOMs (edit or show, depending on permissions)
			$container.find('ul:not(.ui-sortable) li.data').unbind('click').click(function(e){
				$(this).find('a.popup-button:first').click();
				e.stopPropagation();
			}).css({
				'cursor': 'pointer'
			});
		}
		
		// Prevent click propagation on links with noClickPropagation class
		$container.find('ul:not(.ui-sortable) li.data .col a.noClickPropagation').unbind('click').click(function(e) {
		  e.stopPropagation();
		});		
		
		// Column sort
		if(!$container.hasClass('ImageDataObjectManager')) {
			$container.find('li.head a').unbind('click').click(function() {
				refresh($container, $(this).attr('href'));
				return false;
			});
		}
		
		// Filter
		$container.find('.dataobjectmanager-filter select').unbind('change').change(function(e) {
			refresh($container, $(this).attr('value'));
		});

		// Page size
		$container.find('.per-page-control select').unbind('change').change(function(e) {
			refresh($container, $(this).attr('value'));
		});

		
		// Refresh filter
		$container.find('.dataobjectmanager-filter .refresh').unbind('click').click(function(e) {
			refresh($container, $container.attr('href'));
			e.stopPropagation();
			return false;
		})
	
		// Search
		//var request = false;
		$container.find('#srch_fld').focus(function() {
			var i18nSearchString = ss.i18n._t('DialogDataObjectManager.SEARCH', 'Search');
			if($(this).attr('value') == i18nSearchString) $(this).attr('value','').css({'color' : '#333'});
		}).unbind('blur').blur(function() {
			var i18nSearchString = ss.i18n._t('DialogDataObjectManager.SEARCH', 'Search');			
			if($(this).attr('value') == '') $(this).attr('value',i18nSearchString).css({'color' : '#666'});
		}).unbind('keyup').keyup(function(e) {
        
        if ((e.keyCode == 9) || (e.keyCode == 13) || // tab, enter 
           (e.keyCode == 16) || (e.keyCode == 17) || // shift, ctl 
           (e.keyCode >= 18 && e.keyCode <= 20) || // alt, pause/break, caps lock
           (e.keyCode == 27) || // esc 
           (e.keyCode >= 33 && e.keyCode <= 35) || // page up, page down, end 
           (e.keyCode >= 36 && e.keyCode <= 38) || // home, left, up 
            (e.keyCode == 40) || // down 
           (e.keyCode >= 36 && e.keyCode <= 40) || // home, left, up, right, down
           (e.keyCode >= 44 && e.keyCode <= 45) || // print screen, insert 
           (e.keyCode == 229) // Korean XP fires 2 keyup events, the key and 229 
        ) return; 
				// Search on enter key press instead, auto-searching after 500ms after keypress can be confusing
				/*
				if(request) window.clearTimeout(request);
				$input = $(this);
				request = window.setTimeout(function() {
					url = $(container_id).attr('href').replace(/\[search\]=(.)*?&/, '[search]='+$input.attr('value')+'&');
          refresh($container, url, '#srch_fld'); 
					
				},500)*/
			e.stopPropagation();
		}).unbind('keydown').keydown(function(e) {
			// stop event propagation on enter key, we do not want this field to submit any form
			if (e.keyCode == 13) {
				$input = $(this);
				$searchField_select = $container.find('#SearchFieldnameSelect');
				url = $(container_id).attr('href').replace(/\[search\]=(.)*?&/, '[search]='+$input.attr('value')+'&');
				url = url.replace(/\[search_fieldname\]=(.)*?&/, '[search_fieldname]='+$searchField_select.val()+'&');
				refresh($container, url, '#srch_fld'); 				
				e.stopPropagation();
				return false;
			}
		});
		
		$container.find('#srch_clear').unbind('click').click(function() {
			//$container.find('#srch_fld').attr('value','').keyup();
			// Refresh after searchfield was cleared
			var e = jQuery.Event("keydown");
			e.keyCode = jQuery.ui.keyCode.ENTER;
			$container.find('#srch_fld').attr('value','').focus().trigger(e);
		});
		

    $container.find('a.tooltip').tooltip({
		  delay: 500,
		  showURL: false,
		  track: true,
		  bodyHandler: function() {
			  return $(this).parents('li').find('span.tooltip-info').html();
		  }
    });
    
    
    // Add the slider to the ImageDataObjectManager
    if($container.hasClass('ImageDataObjectManager')) {
			var MIN_IMG_SIZE = 25
			var MAX_IMG_SIZE = 300;
			var START_IMG_SIZE = 100;
			var new_image_size;
			$('.size-control').slider({
				
				// Stupid thing doesn't work. Have to force it with CSS
				startValue : (START_IMG_SIZE - MIN_IMG_SIZE) / ((MAX_IMG_SIZE - MIN_IMG_SIZE) / 100),
				slide : function(e, ui) {
					new_image_size = MIN_IMG_SIZE + (ui.value * ((MAX_IMG_SIZE - MIN_IMG_SIZE)/100));
					$('.grid li img.image').css({'width': new_image_size+'px'});
					$('.grid li').css({'width': new_image_size+'px', 'height' : new_image_size +'px'});
				},
				
				stop : function(e, ui) {
					new_image_size = MIN_IMG_SIZE + (ui.value * ((MAX_IMG_SIZE - MIN_IMG_SIZE)/100));				
					url = $(container_id).attr('href').replace(/\[imagesize\]=(.)*/, '[imagesize]='+Math.floor(new_image_size));
					refresh($container, url);
				}
			});
			
			$('.ui-slider-handle').css({'left' : $('#size-control-wrap').attr('class').replace('position','')+'px'});    
    
    }  
    // RelationDataObjectManager
    
    if($container.hasClass('RelationDataObjectManager')) {
			var $checkedList = $(container_id+'_CheckedList');
			$container.find('.actions input, .file-label input').unbind('click').click(function(e){
				if($(this).attr('type') == "radio") {
					$(this).parents('li').siblings('li').removeClass('selected');
					$(this).parents('li').toggleClass('selected');
					$checkedList.attr('value', ","+$(this).val()+",");
				}
				else {
					if ($container.hasClass('ManyMany')) {
						$(this).parents('li').toggleClass('selected');
					}
					else {
						if ($(this).attr('checked')) {
							$(this).parents('li').addClass('selected');
						}
						else {
							$(this).parents('li').removeClass('selected');
						}
					}
					val = ($(this).attr('checked')) ? $checkedList.val() + $(this).val()+"," : $checkedList.val().replace(","+$(this).val()+",",",");
					$checkedList.attr('value', val);
				}
				e.stopPropagation();
			});
	
			$container.find('.actions input, .file-label input').each(function(i,e) {
				if($checkedList.val().indexOf(","+$(e).val()+",") != -1)
					$(e).attr('checked',true).parents('li').addClass('selected');
				else
					$(e).attr('checked',false).parents('li').removeClass('selected');
					
			});	
			
			$container.find('a[rel=clear]').unbind('click').click(function(e) {
			 $container.find('.actions input, .file-label input').each(function(i,e) {
			   $(e).attr('checked', false).parents('li').removeClass('selected');
			   $checkedList.attr('value','');
			 });
			});
			
  		$container.find('.only-related-control input').unbind('click').click(function(e) {
  			refresh($container, $(this).attr('value'));
  			$(this).attr('disabled', true);
  			e.stopPropagation();
  		});
				
    }
		
    // Columns. God forbid there are more than 10.
    cols = $('.list #dataobject-list li.head .fields-wrap .col').length;
    if(cols > 10) {
    	$('.list #dataobject-list li .fields-wrap .col').css({'width' : ((Math.floor(100/cols)) - 0.1) + '%'});
    }
    
    
  $(".ajax-loader").hide();  
    
};

$.fn.DataObjectManager.getPageHeight = function() {
    var windowHeight
    if (self.innerHeight) {	// all except Explorer
      windowHeight = self.innerHeight;
    } else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
      windowHeight = document.documentElement.clientHeight;
    } else if (document.body) { // other Explorers
      windowHeight = document.body.clientHeight;
    }	
    return windowHeight;
};

$.fn.DataObjectManager.getPageScroll = function() {
    var xScroll, yScroll;
    if (self.pageYOffset) {
      yScroll = self.pageYOffset;
      xScroll = self.pageXOffset;
    } else if (document.documentElement && document.documentElement.scrollTop) {	 // Explorer 6 Strict
      yScroll = document.documentElement.scrollTop;
      xScroll = document.documentElement.scrollLeft;
    } else if (document.body) {// all other Explorers
      yScroll = document.body.scrollTop;
      xScroll = document.body.scrollLeft;	
    }
    return new Array(xScroll,yScroll) 
};

$('.DataObjectManager').ajaxSend(function(e,r,s){  
// stupid hack for the cache killer script.
if(s.url.indexOf('EditorToolbar') == -1)
 $(".ajax-loader").show();  
});  
   
$('.DataObjectManager').ajaxStop(function(e,r,s){  
  $(".ajax-loader").hide();  
}); 
$('.DataObjectManager').livequery(function(){
   $(this).DataObjectManager();                           

});

})(jQuery);

/*
 * Show a jQuery dialog
 * The dialog will contain an iframe with the specified href.
 * Always call this function on the topmost document (i.e. via top.ShowDialog()) so that
 * the dialogs will all be in the topmost document body.
 */
function ShowDialog (id, href, dialogTitle, isModal) {
	// add ajax loader to dialog, to be shown until iframe is fully loaded
	var loadingText = ss.i18n._t('DialogDataObjectManager.LOADING', 'Loading');
	var ajaxLoader = '<div id="DialogAjaxLoader"><h2>' + loadingText + '...</h2><img src="dataobject_manager/images/ajax-loader-white.gif" alt="' + loadingText + '..." /></div>';
	// add iframe container div containing the iframe to the body
	jQuery('body').append('<div id="iframecontainer_'+id+'" class="iframe_wrap" style="display:none;"><iframe id="iframe_'+id+'" src="'+href+'" frameborder="0" width="660" height="1"></iframe>'+ajaxLoader+'</div>');
	var domDialog = jQuery('#iframecontainer_'+id);
	
	var iframe = jQuery('#iframe_'+id);
	// set iframe height to the body height (+ some margin space) when iframe is fully loaded.
	iframe.load(function() {
        var iframe_height = Math.max(jQuery(this).contents().find('body').height() + 36, 500);
        jQuery(this).attr('height', iframe_height);
		
		// also remove dialog ajax loader, and enable dialog buttons
		top.RemoveDialogAjaxLoader();
		jQuery(".ui-button:button").attr("disabled",false).removeClass('ui-state-disabled');
    });
	
	var saveText = ss.i18n._t('DialogDataObjectManager.SAVE', 'Save');
	var closeText = ss.i18n._t('DialogDataObjectManager.CLOSE', 'Close');
	// find parent dialog (if one exists) and move it upwards and left
	var nrOfDialogs = jQuery('.ui-dialog').length;
	var left = 200 - (nrOfDialogs-1)*50;
	var parentDialog = jQuery('.ui-dialog').last();
	if (parentDialog.html()) {
		jQuery(parentDialog).animate({
			left: '-=' + left,
			top: '-=50'
		},
		800);
	}
	
	// options for form ajax submission
	var options = {
		dataType: 'json',
		success: function(responseText, statusText, xhr, form) {
			// hide ajax loader in dialog button-pane
			domDialog.parent().find('#AjaxLoader').hide();
			
			var closePopup = false;
			
			// NEW!
			// Is result bad or good?
			try {
				var jsonData = responseText;

				if (jsonData['code'] == 'good') {
					var statusMessage = domDialog.parent().find('#StatusMessage');
					statusMessage.html(jsonData['message']);
					statusMessage.show(500);									
				} 
				else {
					var statusMessage = domDialog.parent().find('#ErrorMessage');
					var error = '';
					
					iframe.contents().find('span[class="message required"]').remove();
					if (jsonData.length > 0) {						
						for (var i = 0; i < jsonData.length; i++) {
							var field = iframe.contents().find('input[name="' + jsonData[i].fieldName + '"]');
							field.parent().append('<span class="message required">' + jsonData[i].message + '</span>');							
						}
						statusMessage.html('Fel i datan');
						statusMessage.show(500);
					}
					else {
						statusMessage.html(jsonData['message']);
						statusMessage.show(500);
					}
				}
				
				if (jsonData['closePopup'] == true) {
					closePopup = true;
					//domDialog.parent().fadeOut(2000, function() { domDialog.dialog('close') });
					//domDialog.dialog('close');
				}
			} 
			catch (e) {
				// Invalid JSON, show as a 'good' response, makes this improvement backward compatible
				var statusMessage = domDialog.parent().find('#StatusMessage');
				statusMessage.html(responseText);
				statusMessage.show(500);
			}
			
			// show status message (in dialog button-pane)
			//var statusMessage = domDialog.parent().find('#ErrorMessage');
			//statusMessage.html(responseText);
			//statusMessage.show(500);
			// refresh content in parent dataobjectmanager
			if (parentDialog.html()) {
				// here we need to refresh the parent dataobjectmanager in the iframe context
				// (iframe javascript functions are accessible via the contentWindow property on the iframe object)
				if (parentDialog.find('iframe').length > 0) {
					var parentDm = parentDialog.find('iframe').contents().find('#' + id);
					parentDialog.find('iframe')[0].contentWindow.refresh(parentDm, parentDm.attr('href'));
				}
				else {
					var parentDm = jQuery('#' + id);
					refresh(parentDm, parentDm.attr('href'));
				}
			}
			else {
				var parentDm = jQuery('#' + id);
				refresh(parentDm, parentDm.attr('href'));
			}
			
			// Refresh dataobjectmanagers inside our own iframe, if we have modified relations during write
			if (iframe.contents().find('.DataObjectManager.RequestHandler').length) {
				iframe.contents().find('.DataObjectManager.RequestHandler').each(function() {
					iframe[0].contentWindow.refresh(jQuery(this), jQuery(this).attr('href'));
				});
			}
			
			// enable dialog buttons
			jQuery(".ui-button:button").attr("disabled",false).removeClass('ui-state-disabled');
			
			// Close on success?
			if (closePopup == true)
				domDialog.dialog('close');
		},
		error: function(responseText, statusText, xhr, form) {
			// hide ajax loader in dialog button-pane
			domDialog.parent().find('#AjaxLoader').hide();
			// show error message (in dialog button-pane)
			var errorMessage = domDialog.parent().find('#ErrorMessage');
			errorMessage.html(responseText);
			errorMessage.show(500);
			// enable dialog buttons
			jQuery(".ui-button:button").attr("disabled",false).removeClass('ui-state-disabled');
		}
	};
	
	var buttonOptions = {};
	buttonOptions[saveText] = function() {
		// disable dialog buttons
		jQuery(".ui-button:button").attr("disabled","disabled").addClass('ui-state-disabled');
		// hide status and error messages
		jQuery(this).parent().find('.Message').hide();
		// show ajax loader
		jQuery(this).parent().find('#AjaxLoader').show();
		// submit form via ajax
		jQuery(this).find('iframe').contents().find('form').ajaxSubmit(options);
	};
	buttonOptions[closeText] = function(){
		jQuery(this).dialog("close");
	};
	
	// show jQuery dialog
	domDialog.dialog({
		modal: isModal,
		title: dialogTitle,
		width: 700,
		height: 600,
		show: 'fade',
		buttons: buttonOptions,
		create: function() {
			// disable dialog buttons (will be enabled when iframe content is fully loaded)
			jQuery(".ui-button:button").attr("disabled","disabled").addClass('ui-state-disabled');
			// add ajax loader and output messages to dialog button-pane
			var loadingText = ss.i18n._t('DialogDataObjectManager.LOADING', 'Loading');
			jQuery(this).parent().find('.ui-dialog-buttonpane').append('<div id="Output" style="float:left;"><div id="AjaxLoader" style="display:none;"><img src="dataobject_manager/images/ajax-loader-white.gif" alt="' + loadingText + '..." /></div><div id="StatusMessage" class="Message" style="display:none;"></div><div id="ErrorMessage" class="Message" style="display:none;"></div></div>');
		},
		close: function(event, ui){
			// move the parent dialog back
			if (parentDialog.html()) {
				jQuery(parentDialog).animate({
					left: '+=' + left,
					top: '+=50'
				},
				800);
			}
			// remove the dialog from the DOM, so that we do not leave a lot of unecessary data in the DOM tree
			jQuery(this).remove();
		}
	});
}

/*
 * Show a jQuery dialog (wizard mode)
 * The dialog will contain an iframe with the specified href.
 * Always call this function on the topmost document (i.e. via top.ShowDialog()) so that
 * the dialogs will all be in the topmost document body.
 */
function ShowWizardDialog (id, href, dialogTitle, isModal) {
	// add ajax loader to dialog, to be shown until iframe is fully loaded
	var loadingText = ss.i18n._t('DialogDataObjectManager.LOADING', 'Loading');
	var ajaxLoader = '<div id="DialogAjaxLoader"><h2>' + loadingText + '...</h2><img src="dataobject_manager/images/ajax-loader-white.gif" alt="' + loadingText + '..." /></div>';
	// add iframe container div containing the iframe to the body
	jQuery('body').append('<div id="iframecontainer_'+id+'" class="iframe_wrap" style="display:none;"><iframe id="iframe_'+id+'" src="'+href+'" frameborder="0" width="660" height="1"></iframe>'+ajaxLoader+'</div>');
	var domDialog = jQuery('#iframecontainer_'+id);
	
	var iframe = jQuery('#iframe_'+id);
	// set iframe height to the body height (+ some margin space) when iframe is fully loaded.
	iframe.load(function() {
        var iframe_height = Math.max(jQuery(this).contents().find('body').height() + 36, 500);
        jQuery(this).attr('height', iframe_height);
		
		// also remove dialog ajax loader, and enable dialog buttons
		top.RemoveDialogAjaxLoader();
		jQuery(".ui-button:button").attr("disabled",false).removeClass('ui-state-disabled');
    });
	
	var continueText = ss.i18n._t('DialogDataObjectManager.CONTINUE', 'Continue');
	var backText = ss.i18n._t('DialogDataObjectManager.BACK', 'Back');
	var saveText = ss.i18n._t('DialogDataObjectManager.SAVE', 'Save');
	var closeText = ss.i18n._t('DialogDataObjectManager.CLOSE', 'Close');
	// find parent dialog (if one exists) and move it upwards and left
	var nrOfDialogs = jQuery('.ui-dialog').length;
	var left = 200 - (nrOfDialogs-1)*50;
	var parentDialog = jQuery('.ui-dialog').last();
	if (parentDialog.html()) {
		jQuery(parentDialog).animate({
			left: '-=' + left,
			top: '-=50'
		},
		800);
	}
	
	// options for form ajax submission
	var options = {
		dataType: 'json',
		success: function(responseText, statusText, xhr, form) {
			// hide ajax loader in dialog button-pane
			domDialog.parent().find('#AjaxLoader').hide();
			
			var closePopup = false;
			
			// NEW!
			// Is result bad or good?
			try {
				var jsonData = responseText;

				if (jsonData['code'] == 'good') {
					var statusMessage = domDialog.parent().find('#StatusMessage');
					statusMessage.html(jsonData['message']);
					statusMessage.show(500);									
				} 
				else {
					var statusMessage = domDialog.parent().find('#ErrorMessage');
					var error = '';
					
					iframe.contents().find('span[class="message required"]').remove();
					if (jsonData.length > 0) {						
						for (var i = 0; i < jsonData.length; i++) {
							var field = iframe.contents().find('input[name="' + jsonData[i].fieldName + '"]');
							field.parent().append('<span class="message required">' + jsonData[i].message + '</span>');							
						}
						statusMessage.html('Fel i datan');
						statusMessage.show(500);
					}
					else {
						statusMessage.html(jsonData['message']);
						statusMessage.show(500);
					}
				}
				
				if (jsonData['closePopup'] == true) {
					closePopup = true;
					//domDialog.parent().fadeOut(2000, function() { domDialog.dialog('close') });
					//domDialog.dialog('close');
				}
			} 
			catch (e) {
				// Invalid JSON, show as a 'good' response, makes this improvement backward compatible
				var statusMessage = domDialog.parent().find('#StatusMessage');
				statusMessage.html(responseText);
				statusMessage.show(500);
			}
			
			// show status message (in dialog button-pane)
			//var statusMessage = domDialog.parent().find('#ErrorMessage');
			//statusMessage.html(responseText);
			//statusMessage.show(500);
			// refresh content in parent dataobjectmanager
			if (parentDialog.html()) {
				// here we need to refresh the parent dataobjectmanager in the iframe context
				// (iframe javascript functions are accessible via the contentWindow property on the iframe object)
				if (parentDialog.find('iframe').length > 0) {
					var parentDm = parentDialog.find('iframe').contents().find('#' + id);
					parentDialog.find('iframe')[0].contentWindow.refresh(parentDm, parentDm.attr('href'));
				}
				else {
					var parentDm = jQuery('#' + id);
					refresh(parentDm, parentDm.attr('href'));
				}
			}
			else {
				var parentDm = jQuery('#' + id);
				refresh(parentDm, parentDm.attr('href'));
			}
			
			// Refresh dataobjectmanagers inside our own iframe, if we have modified relations during write
			if (iframe.contents().find('.DataObjectManager.RequestHandler').length) {
				iframe.contents().find('.DataObjectManager.RequestHandler').each(function() {
					iframe[0].contentWindow.refresh(jQuery(this), jQuery(this).attr('href'));
				});
			}
			
			// enable dialog buttons
			jQuery(".ui-button:button").attr("disabled",false).removeClass('ui-state-disabled');
			
			// Close on success?
			if (closePopup == true)
				domDialog.dialog('close');
		},
		error: function(responseText, statusText, xhr, form) {
			// hide ajax loader in dialog button-pane
			domDialog.parent().find('#AjaxLoader').hide();
			// show error message (in dialog button-pane)
			var errorMessage = domDialog.parent().find('#ErrorMessage');
			errorMessage.html(responseText);
			errorMessage.show(500);
			// enable dialog buttons
			jQuery(".ui-button:button").attr("disabled",false).removeClass('ui-state-disabled');
		}
	};
	
	var buttonOptions = {};
	buttonOptions[continueText] = function() {
		jQuery(this).find('iframe')[0].contentWindow.gotoNextTab();
	}
	buttonOptions[saveText] = function() {
		if (!jQuery(this).find('iframe')[0].contentWindow.isLastTabValid())
			return;
		
		// disable dialog buttons
		jQuery(".ui-button:button").attr("disabled","disabled").addClass('ui-state-disabled');
		// hide status and error messages
		jQuery(this).parent().find('.Message').hide();
		// show ajax loader
		jQuery(this).parent().find('#AjaxLoader').show();
		// submit form via ajax
		jQuery(this).find('iframe').contents().find('form').ajaxSubmit(options);
	};
	buttonOptions[backText] = function() {
		jQuery(this).find('iframe')[0].contentWindow.gotoPrevTab();
	}		
	buttonOptions[closeText] = function(){
		jQuery(this).dialog("close");
	};
	
	// show jQuery dialog
	domDialog.dialog({
		modal: isModal,
		title: dialogTitle,
		width: 700,
		height: 600,
		show: 'fade',
		buttons: buttonOptions,
		create: function() {
			// disable dialog buttons (will be enabled when iframe content is fully loaded)
			jQuery(".ui-button:button").attr("disabled","disabled").addClass('ui-state-disabled');
			TabChangedTo('first');
			// add ajax loader and output messages to dialog button-pane
			var loadingText = ss.i18n._t('DialogDataObjectManager.LOADING', 'Loading');
			jQuery(this).parent().find('.ui-dialog-buttonpane').append('<div id="Output" style="float:left;"><div id="AjaxLoader" style="display:none;"><img src="dataobject_manager/images/ajax-loader-white.gif" alt="' + loadingText + '..." /></div><div id="StatusMessage" class="Message" style="display:none;"></div><div id="ErrorMessage" class="Message" style="display:none;"></div></div>');
		},
		close: function(event, ui){
			// move the parent dialog back
			if (parentDialog.html()) {
				jQuery(parentDialog).animate({
					left: '+=' + left,
					top: '+=50'
				},
				800);
			}
			// remove the dialog from the DOM, so that we do not leave a lot of unecessary data in the DOM tree
			jQuery(this).remove();
		}
	});
}

// Function for setting the iframe height on the last jQuery dialog shown
function SetIframeHeight() {
	var dialog = jQuery('.ui-dialog').last();
	var iframe = dialog.find('iframe');
	var iframe_height = Math.max(iframe.contents().find('body').height() + 36, 500);
    iframe.attr('height', iframe_height);
}

function RemoveDialogAjaxLoader() {
	jQuery('#DialogAjaxLoader').remove();
}

function TabChangedTo(position) {
	var dialog = jQuery('.ui-dialog').last();
	if (position == "initial") {
		jQuery(".ui-dialog-buttonset .ui-button:button", dialog).each(function(index) {
			if (index == 3)
				jQuery(this).show();
			else 
				jQuery(this).hide();
		});		
	}
	else if (position == 'first') {
		jQuery(".ui-dialog-buttonset .ui-button:button", dialog).each(function(index) {
			if (index == 0)
				jQuery(this).show();
			else if (index == 3)
				jQuery(this).show();
			else 
				jQuery(this).hide();
		});
	}
	else if (position == 'last') {
		jQuery(".ui-dialog-buttonset .ui-button:button", dialog).each(function(index) {
			if (index == 1)
				jQuery(this).show();
			else if (index == 2)
				jQuery(this).show();
			else 
				jQuery(this).hide();
		});
	}
	else {
		jQuery(".ui-dialog-buttonset .ui-button:button", dialog).each(function(index) {
			if (index == 0)
				jQuery(this).show();
			else if (index == 2)
				jQuery(this).show();
			else 
				jQuery(this).hide();
		});
	}
}

function refresh($div, link, focus)
{
	 // Kind of a hack. Pass the list of ids to the next refresh
	 var listValue = ($div.hasClass('RelationDataObjectManager')) ? jQuery('#'+$div.attr('id')+'_CheckedList').val() : false;
	 
	 var $container = jQuery('#'+$div.attr('id')); 
	 var loadingText = ss.i18n._t('DialogDataObjectManager.LOADING', 'Loading');
	 $container.find('div.dataobject-list').block({message: '<h2 style="padding-top: 5px; padding-bottom: 5px; background-color: transparent;"><img style="vertical-align: middle; margin-right: 20px" src="dataobject_manager/images/ajax-loader-white.gif" alt="' + loadingText + '..." />' + loadingText + '...</h2>',
													css: {'background-color': '#fff'}});
	 	 
	 jQuery.ajax({
	   type: "GET",
	   url: link,
	   success: function(html){
	   		if(!$div.next().length && !$div.prev().length)
	   			$div.parent().html(html);
	   		else
				$div.replaceWith(html);
        	
			if(listValue) {
				 $div.find('#'+$div.attr('id')+'_CheckedList').attr('value',listValue);
			}
			var $container = jQuery('#'+$div.attr('id')); 
			$container.DataObjectManager();
			if (typeof focus == 'string') { 
				$container.find(focus).focus(); 
			}
			$container.find('div.dataobject-list').unblock();			
			$container.find('li.data').effect('highlight');
			top.SetIframeHeight();
		}
	 });
}