<div class="Pagination">
	<% if FirstLink %><a class="First" href="$FirstLink" title="<% _t('DataObjectManager.VIEWFIRST', 'View first') %> $PageSize"><img src="dataobject_manager/images/resultset_first.png" alt="" /></a>
	<% else %><span class="First"><img  src="dataobject_manager/images/resultset_first_disabled.png" alt="" /></span><% end_if %>
	<% if PrevLink %><a class="Prev" href="$PrevLink" title="<% _t('DataObjectManager.VIEWPREVIOUS', 'View previous') %> $PageSize"><img src="dataobject_manager/images/resultset_previous.png" alt="" /></a>
	<% else %><img class="Prev" src="dataobject_manager/images/resultset_previous_disabled.png" alt="" /><% end_if %>
	<span class="Count">
		<% _t('DataObjectManager.DISPLAYING', 'Displaying') %> $FirstItem <% _t('DataObjectManager.TO', 'to') %> $LastItem <% _t('DataObjectManager.OF', 'of') %> $TotalCount
	</span>
	<% if NextLink %><a class="Next" href="$NextLink" title="<% _t('DataObjectManager.VIEWNEXT', 'View next') %> $PageSize"><img src="dataobject_manager/images/resultset_next.png" alt="" /></a>
	<% else %><img class="Next" src="dataobject_manager/images/resultset_next_disabled.png" alt="" /><% end_if %>
	<% if LastLink %><a class="Last" href="$LastLink" title="<% _t('DataObjectManager.VIEWLAST', 'View last') %> $PageSize"><img src="dataobject_manager/images/resultset_last.png" alt="" /></a>
	<% else %><span class="Last"><img src="dataobject_manager/images/resultset_last_disabled.png" alt="" /></span><% end_if %>
</div>