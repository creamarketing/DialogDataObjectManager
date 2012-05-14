<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
	
	<head>
		<% base_tag %>
		<meta content="text/html; charset=utf-8" http-equiv="Content-type"/> 
		<% if emulateIE7 %>
		<meta http-equiv="X-UA-Compatible" content="IE=EmulateIE7" />
		<% end_if %>
		<style type="text/css">
			body {
				font-size: 62.5%;
				margin: 0px;
			}
		</style>
	</head>
	
	<body>
		<div class="popup-container">
			<div id="DataObjectManager-popup-$UniqueID" class="DataObjectManager-popup loading <% if String %><% if NestedController %>nestedController<% end_if %><% else %><% if DetailForm.NestedController %>nestedController<% end_if %><% end_if %>	">
				<div class="status_message"></div>
				<div class="error_message"></div>
				<div class="right $PopupClasses">
					$DetailForm
				</div>
			</div>
		</div>
	</body>
	
</html>