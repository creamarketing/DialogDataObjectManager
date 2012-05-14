<div id="$id" class="RequestHandler FormField DataObjectManager $NestedType field" href="$CurrentLink">
	<div class="ajax-loader"></div>
	<% if HasFilter || HasHeader %>
	<div class="dataobjectmanager-actions <% if HasFilter %>filter<% end_if %>">
		<% if Can(add) %>
			<a class="popup-button<% if WizardMode %> wizard-mode<% end_if %>" rel="$PopupWidth" href="$AddLink" alt="add" title="<% sprintf(_t('DataObjectManager.ADDITEM','Add %s',PR_MEDIUM,'Add [name]'),$AddTitle) %>">
				<span class="uploadlink"><img src="dataobject_manager/images/add.png" alt="" /><% sprintf(_t('DataObjectManager.ADDITEM','Add %s',PR_MEDIUM,'Add [name]'),$AddTitle) %></span>
			</a>	
		<% else_if HasHeader %>
		  <h3>$PluralTitle</h3>
		<% end_if %>
	</div>
	<% if HasFilter %>
		<div class="dataobjectmanager-filter">
			$FilterDropdown
		</div>
	<% end_if %>
	<% end_if %>
	<div style="clear:both;"></div>
	<div class="top-controls">
		<div class="rounded_table_top_right">
			<div class="rounded_table_top_left">
				<% if PaginationControlsLocation = top %>
					<% include DialogDataObjectManager_PaginationControls %>
				<% end_if %>
				<% if HasSearchableFields %>
					<div class="dataobjectmanager-search-fieldname">
						$SearchableFieldsDropdown
					</div>
				<% end_if %>				
				<div class="dataobjectmanager-search">
					<span class="sbox_l"></span><span class="sbox"><input value="<% if SearchValue %>$SearchValue<% else %><% _t('DataObjectManager.SEARCH','Search') %><% end_if %>" type="text" id="srch_fld"  /></span><span class="sbox_r" id="srch_clear"></span>
				</div>
				<div style="clear:both;"></div>
			</div>
		</div>
	</div>
	<div class="list column{$Headings.Count}" class="list-holder" style="width:100%;">
		<div class="dataobject-list">		
		<ul <% if ShowAll %>class="sortable-{$sourceClass}"<% end_if %>>
				<li class="head">
					<div class="fields-wrap">
					<% control Headings %>
					<div class="col $FirstLast" {$ColumnWidthCSS}>
						<div class="pad">
								<% if IsSortable %>
								<a href="$SortLink">$Title &nbsp;
								<% if IsSorted %>
									<% if SortDirection = ASC %>
									<img src="cms/images/bullet_arrow_up.png" alt="" />
									<% else %>
									<img src="cms/images/bullet_arrow_down.png" alt="" />
									<% end_if %>
								<% end_if %>
								</a>
								<% else %>
								$Title
								<% end_if %>
						</div>
					</div>
					<% end_control %>
					</div>
					<div class="actions col">&nbsp;</div>
				</li>
			<% if Items %>
			<% control Items %>
				<li class="data <% if HighlightClasses %>$HighlightClasses<% end_if %>" id="record-$Parent.id-$ID">
						<div class="fields-wrap">
						<% control Fields %>
						<div class="col" {$ColumnWidthCSS}><div class="pad"><% if Value %>$Value<% else %>&nbsp;<% end_if %></div></div>
						<% end_control %>
						</div>
						<div class="actions col">
								<% include Actions %>
						</div>
				</li>
			<% end_control %>
			<% else %>
					<li><i><% sprintf(_t('DataObjectManager.NOITEMSFOUND','No %s found'),$PluralTitle) %></i></li>
			<% end_if %>
		</ul>
		</div>
	</div>
	<div class="bottom-controls">
		<div class="rounded_table_bottom_right">
			<div class="rounded_table_bottom_left">
				<div class="sort-control">
					<% if Sortable %>
						<input id="showall-{$id}" type="checkbox" <% if ShowAll %>checked="checked"<% end_if %> value="<% if Paginated %>$ShowAllLink<% else %>$PaginatedLink<% end_if %>" /><label for="showall-{$id}"><% _t('DataObjectManager.DRAGDROP','Allow drag &amp; drop reordering') %></label>
					<% end_if %>
				</div>
				<% if PaginationControlsLocation = bottom %>
					<% include DialogDataObjectManager_PaginationControls %>
				<% end_if %>				
				<div class="per-page-control">
					<% if ShowAll %><% else %>$PerPageDropdown<% end_if %>
				</div>
			</div>
		</div>
	</div>
</div>