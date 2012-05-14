<?php

class DialogDataObjectManager extends DataObjectManager {
	
	protected $uniqueID = ''; 
	
	protected $template = "DialogDataObjectManager";
	public $templatePopup = "DialogDataObjectManager_popup";
	public $itemClass = "DialogDataObjectManager_Item";
	public $popupClass = "DialogDataObjectManager_Popup";
	protected $hasHeader = true;
	protected $paginationControlsLocation = 'bottom';
	protected $searchableFields;
	protected $searchFieldname = '';
	protected $wizardMode = false;
	protected $sortingAllowed = true;
	
	public static $emulateIE7_inPopup = true;
	
	function __construct($controller, $name = null, $sourceClass = null, $fieldList = null, $detailFormFields = null, $sourceFilter = "", $sourceSort = null, $sourceJoin = "") {
		// create the list of summary fields if it is not explicitly given
		if (!$fieldList) {
			$fieldList = array();
			// create the list from the static summary fields variable
			$sng = singleton($sourceClass);
			foreach ($sng->summaryFields() as $summaryField) {
				// create an associative array with field name as key, and translated property as value
				$upperCaseName = strtoupper($summaryField);
				$fieldList[$summaryField] = _t("{$sourceClass}.{$upperCaseName}", "$summaryField");
			}
		}
		
		parent::__construct($controller, $name, $sourceClass, $fieldList, $detailFormFields, $sourceFilter, $sourceSort, $sourceJoin, true);
		
		$this->uniqueID = $this->name . '_' . md5(mt_rand());
		
		// block dataobject_managers.js and use dialog_dataobject_manager.js instead
		Requirements::block('dataobject_manager/javascript/dataobject_manager.js');
		Requirements::block('dataobject_manager/javascript/facebox.js');
		Requirements::javascript('dialog_dataobject_manager/javascript/dialog_dataobject_manager.js');
		
		// javascript localization
		Requirements::javascript('sapphire/javascript/i18n.js');
		Requirements::add_i18n_javascript('dialog_dataobject_manager/javascript/lang');
		
		// add jquery-stuff needed for jquery dialogs in dataobjectmanager(s)
		Requirements::javascript('sapphire/thirdparty/jquery-form/jquery.form.js');
		Requirements::javascript('sapphire/thirdparty/jquery-metadata/jquery.metadata.js');
		Requirements::javascript('dialog_dataobject_manager/javascript/jquery-ui-1.8.6.custom.min.js');
		Requirements::css('dialog_dataobject_manager/css/smoothness/jquery-ui-1.8.6.custom.css');
		Requirements::css('cms/css/cms_right.css');
		
		// block css and javascript that we do not want (that can be included from form-fields)
		Requirements::block('cms/css/typography.css');
		Requirements::block('sapphire/css/Form.css');
		Requirements::block('http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.1/themes/smoothness/jquery-ui.css');
		Requirements::block('http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.1/jquery-ui.min.js');
		Requirements::block(THIRDPARTY_DIR.'/jquery-ui-themes/smoothness/jquery-ui-1.8rc3.custom.css');
		Requirements::block('dataobject_manager/css/ui/dom_jquery_ui.css');
		
		// blockUI is used to overlay a loading message when data is loading
		Requirements::javascript('dialog_dataobject_manager/javascript/jquery.blockUI.js');
		
		Requirements::css('dialog_dataobject_manager/css/DialogDataObjectManager_extras.css');
		
		// set singular and plural titles
		$this->setAddTitle(_t("{$sourceClass}.SINGULARNAME", "$sourceClass"));
		$this->setSingleTitle(_t("{$sourceClass}.SINGULARNAME", "$sourceClass"));
		$this->setPluralTitle(_t("{$sourceClass}.PLURALNAME", "$sourceClass"));
		
		// set permissions for source object
		$this->permissions = $this->setObjectPermissions();
		
		// search items.. custom		
		$this->searchableFields = $fieldList;
		if(isset($_REQUEST['ctf'][$this->Name()])) {
			$this->searchFieldname = isset($_REQUEST['ctf'][$this->Name()]['search_fieldname']) ? $_REQUEST['ctf'][$this->Name()]['search_fieldname'] : '';
		}		
		$this->customSearchItems();
		
		// sort items.. custom
		$this->customSortItems();
	}
	
	public function setSorting($sourceSort, $allowDragDrop) {
		$this->sortingAllowed = $allowDragDrop;
		$this->sourceSort = $sourceSort;
		if($this->sourceSort) {
			$parts = explode(" " , $this->sourceSort);
			if(is_array($parts) && sizeof($parts) == 2) {
				list($field,$dir) = $parts;
				$this->sort = trim($field);
				$this->sort_dir = trim($dir);
			}
			else {
				$this->sort = $this->sourceSort;
				$this->sort_dir = "ASC";
			}
			$this->loadSort();
			$this->customSortItems();
		}
	}
	
	public function getSortingAllowed() {
		return $this->sortingAllowed;
	}
	
	public function setWizardMode($wizardMode) {
		$this->wizardMode = $wizardMode;
	}
	
	public function getWizardMode() {
		return $this->wizardMode;
	}
	
	public function setHasHeader($hasHeader) {
		$this->hasHeader = $hasHeader;
	}
	
	public function getHasHeader() {
		return $this->hasHeader;
	}
	
	public function setPaginationControlsLocation($location) {
		$this->paginationControlLocations = $location;
	}
	
	public function getPaginationControlsLocation() {
		return $this->paginationControlsLocation;
	}
	
	private function setObjectPermissions() {
		$permissions = array();
		$obj = singleton($this->sourceClass);
		
		$extended = $obj->extendedCan('canView', Member::currentUser());
		$normal = $obj->canView();
		if ($extended || ($extended === null && $normal)) {
			$permissions[] = 'show';
		}
		
		$extended = $obj->extendedCan('canEdit', Member::currentUser());
		$normal = $obj->canEdit();
		if ($extended || ($extended === null && $normal)) {
			$permissions[] = 'edit';
		}
		
		$extended = $obj->extendedCan('canDelete', Member::currentUser());
		$normal = $obj->canDelete();
		if ($extended || ($extended === null && $normal)) {
			$permissions[] = 'delete';
		}
		
		$extended = $obj->extendedCan('canCreate', Member::currentUser());
		$normal = $obj->canCreate();
		if ($extended || ($extended === null && $normal)) {
			$permissions[] = 'add';
		}
		
		$extended = $obj->extendedCan('canDuplicate', Member::currentUser());
		$normal = $obj->hasMethod('canDuplicate') ? $obj->canDuplicate() : false;
		if ($extended || ($extended === null && $normal)) {
			$permissions[] = 'duplicate';
		}		
		
		return $permissions;
	}
	
	/**
	 * Overridden so that we can use the same form for adding and editing items
	 */
	function add() {
		return new DialogDataObjectManager_ItemRequest($this, 0);
	}
	
	/**
	 * Overridden to use DialogDataObjectManager_ItemRequest instead of DataObjectManager_ItemRequest
	 */
	public function handleItem($request) {
		return new DialogDataObjectManager_ItemRequest($this, $request->param('ID'));
	}
	
	/**
	 * Overridden to use DialogDataObjectManager_ItemRequest instead of DataObjectManager_ItemRequest
	 */
	public function handleDuplicate($request) {
		return new DialogDataObjectManager_ItemRequest($this,$request->param('ID'));
	}
	
	/**
	 * Return a unique id (based on the field name and a md5-hash from a random number).
	 * We need a unique id here since we might have multiple DOMs with the same field name in different dialogs.
	 */
	function id() {
		//return $this->uniqueID;
		// unique id is disabled for now, it messes up DOM refreshing.
		// although circular dialog DOMs are possible, they do not work properly without using unique
		// ids, so this needs to be fixed if such are needed.
		return parent::id();
	}
	
	public function getQueryString($params = array())
	{ 
		$queryString = parent::getQueryString($params);
		$search_fieldname = isset($params['search_fieldname']) ? $params['search_fieldname'] : $this->searchFieldname;
		return "ctf[{$this->Name()}][search_fieldname]={$search_fieldname}&" . $queryString;
	}
	
	public function HasSearchableFields()
	{
		return !empty($this->searchableFields);
	}
	
	public function SearchableFieldsDropdown()
	{
		$value = $this->searchFieldname;
		$map = array('' => _t('DataObjectManager.ALL', 'All'));
		$map += $this->searchableFields;
		
		$dropdown = new DropdownField("SearchFieldnameSelect", '', $map, $value);
		return $dropdown->Field();
	}	
	
	/** 
	 * customSearchItems is used when searching db and non-db getters, slower.. but so much nicer :/
	 */
	function customSearchItems() {
		if(empty($this->search)) return;
			
	    $SNG = singleton($this->sourceClass);
		
		if (empty($this->searchFieldname))
			$headings = $this->Headings();
		else {
			$headings = new DataObjectSet();
			$allHeadings = $this->Headings();
			$field = $allHeadings->find('Name', $this->searchFieldname);
			if ($field) 
				$headings->push($field);
		}
		
		$sourceSort = null;
		if ($SNG->hasDatabaseField($this->sort) || (strstr($this->sort, '.') && $SNG->relObject($this->sort)))
			$sourceSort = $this->sourceSort;		
				
		$items = DataObject::get($this->sourceClass, $this->sourceFilter, $sourceSort, $this->sourceJoin);
		
		$validItems = array();
		
		if ($items) {
			foreach($items as $item) {
				$was_found = false;
				foreach($headings as $field) {
					$fieldName = $field->Name;

					if (strstr($fieldName, '.')) {
						$parts = explode('.', $fieldName);
						$parts_count = count($parts);

						$tmp_item = $item;

						for ($i=0;$i<$parts_count-1;$i++) {
							$tmp_item = $item->$parts[$i]();
						}

						if ($tmp_item->hasMethod($parts[$parts_count-1]))
							$fieldValue = $tmp_item->$parts[$parts_count-1]();
						else 
							$fieldValue = $tmp_item->$parts[$parts_count-1];
					}
					else {
						if ($item->hasMethod($fieldName))
							$fieldValue = $item->$fieldName();
						else
							$fieldValue = $item->$fieldName;
					}

					if (preg_match('/' . $this->search . '/i', $fieldValue)) {
						$was_found = true;					
					}
				}

				if ($was_found)
					$validItems[] = $item;
			}		
		}
			
		$this->setCustomSourceItems(new DataObjectSet($validItems));
	}
	
	
	/**
	 * customSortItems is used for sorting column that use non-db getters
	 */
	function customSortItems() {
		
		if (empty($this->sort) || empty($this->sort_dir))
			return;
		
		$sortFieldName = $this->sort;
				
		if (!singleton($this->sourceClass)->hasDatabaseField($sortFieldName) && !(strstr($sortFieldName, '.') && singleton($this->sourceClass)->relObject($sortFieldName))) {
			if ($this->customSourceItems) {
				$this->customSourceItems->sort($this->sort, $this->sort_dir);
			}
			else {
				$items = DataObject::get($this->sourceClass, $this->sourceFilter, '', $this->sourceJoin);
				if ($items) {
					$this->setCustomSourceItems($items);
					$this->customSourceItems->sort($this->sort, $this->sort_dir);				
				}
			}
		}
	}
	
	/**
	 * Overridden so that we do not have to save the object before adding/editing neseted DOMs
	 */
	function FieldHolder() {
		// set caption if required
		if($this->popupCaption) {
			$id = $this->id();
			if(Director::is_ajax()) {
			$js = <<<JS
$('$id').GB_Caption = '$this->popupCaption';
JS;
				FormResponse::add($js);
			} else {
			$js = <<<JS
Event.observe(window, 'load', function() { \$('$id').GB_Caption = '$this->popupCaption'; });
JS;
				Requirements::customScript($js);
			}
		}

		// compute sourceItems here instead of Items() to ensure that
		// pagination and filters are respected on template accessors
		$this->sourceItems();

		return $this->renderWith($this->template);
	}
	
	/*
	 * Overridden to allow us to disable sorting
	 */	
	public function Sortable()
	{
		return (SortableDataObject::is_sortable_class($this->sourceClass()) && $this->sortingAllowed) ? true : false;
	}	
	
	/**
	 * Overridden to use our own search 
	 */	
	protected function loadSourceFilter()
	{
		$filter_string = "";
		if(!empty($this->filter)) {
			$break = strpos($this->filter, "_");
			$field = substr($this->filter, 0, $break);
			$value = substr($this->filter, $break+1, strlen($this->filter) - strlen($field));
			$filter_string = $field . "='$value'";
		}	

		$search_string = "";
		/*if(!empty($this->search)) {
			$search = array();
	        $SNG = singleton($this->sourceClass); 			
			foreach(parent::Headings() as $field) {
				if($SNG->hasDatabaseField($field->Name))	
					$search[] = "UPPER($field->Name) LIKE '%".strtoupper($this->search)."%'";
			}
			$search_string = "(".implode(" OR ", $search).")";
		}
		*/
		/*$and = (!empty($this->filter) && !empty($this->search)) ? " AND " : "";
		$source_filter = $filter_string.$and.$search_string;*/
		$source_filter = $filter_string;
		if(!$this->sourceFilter) $this->sourceFilter = $source_filter;
		else if($this->sourceFilter && !empty($source_filter)) $this->sourceFilter .= " AND " . $source_filter;		
	}	
		
	/**
	 * Overriden to make column sorting work correctly, in original tablelistfield the sort order parameter was called [ctf][dir] but
	 * in DataObjectManager it is called ctf[sort_dir]
	 */
	function getQuery() {
		if($this->customQuery) {
			$query = clone $this->customQuery;
			$baseClass = ClassInfo::baseDataClass($this->sourceClass);
		} else {
			if(!empty($_REQUEST['ctf'][$this->Name()]['sort'])) {
				$sortFieldName = $_REQUEST['ctf'][$this->Name()]['sort'];
			
				if (singleton($this->sourceClass)->hasDatabaseField($sortFieldName) || (strstr($sortFieldName, '.') && singleton($this->sourceClass)->relObject($sortFieldName)))
					$query = singleton($this->sourceClass)->extendedSQL($this->sourceFilter(), $this->sourceSort, null, $this->sourceJoin);
				else
					$query = singleton($this->sourceClass)->extendedSQL($this->sourceFilter(), null, null, $this->sourceJoin);
			} 
			else
				$query = singleton($this->sourceClass)->extendedSQL($this->sourceFilter(), $this->sourceSort, null, $this->sourceJoin);
		}
		
		if(!empty($_REQUEST['ctf'][$this->Name()]['sort'])) {
			$column = $_REQUEST['ctf'][$this->Name()]['sort'];
			$dir = 'ASC';
			if(!empty($_REQUEST['ctf'][$this->Name()]['sort_dir'])) {
				$dir = $_REQUEST['ctf'][$this->Name()]['sort_dir'];
				if(strtoupper(trim($dir)) == 'DESC') $dir = 'DESC';
			}
			if($query->canSortBy($column)) $query->orderby = $column.' '.$dir;
		}
		
		return $query;
	}
	
	/**
	 * Overriden to allow all non-db column fields to be sortable, try stripping out Nice, 
	 * if that fails use the non-db fieldname direcly and sort it using PHP
	 */
	public function Headings()
	{	
		$headings = array();
		foreach($this->fieldList as $fieldName => $fieldTitle) {
			if(isset($_REQUEST['ctf'][$this->Name()]['sort_dir'])) 
				$dir = $_REQUEST['ctf'][$this->Name()]['sort_dir'] == "ASC" ? "DESC" : "ASC";
			else 
				$dir = "ASC"; 
			
			$sortable = true; // Always sortable or not
			$sortFieldName = $fieldName;
			// check for sort field overrides, i.e. if the source class has a static 'sortfield_override' array
			// where there is a key for this field name
			$sortFieldOverrides = Object::get_static($this->sourceClass, 'sortfield_override');
			if ($sortFieldOverrides && is_array($sortFieldOverrides) && isset($sortFieldOverrides[$fieldName])) {
				$sortFieldName = $sortFieldOverrides[$fieldName];
			}
			if (!singleton($this->sourceClass)->hasDatabaseField($sortFieldName)) {
				if (strstr($sortFieldName, '.') && singleton($this->sourceClass)->relObject($sortFieldName)) {
					$sortable = true;
				}
			}
			else
				$sortable = true;
			
			$headings[] = new ArrayData(array(
				"Name" => $fieldName, 
				"Title" => ($this->sourceClass) ? singleton($this->sourceClass)->fieldLabel($fieldTitle) : $fieldTitle,
				"IsSortable" => $sortable,
				"SortLink" => $this->RelativeLink(array(
					'sort_dir' => $dir,
					'sort' => $sortFieldName
				)),
				"SortDirection" => $dir,
				"IsSorted" => (isset($_REQUEST['ctf'][$this->Name()]['sort'])) && ($_REQUEST['ctf'][$this->Name()]['sort'] == $sortFieldName),
				"ColumnWidthCSS" => !empty($this->column_widths) ? sprintf("style='width:%f%%;'",($this->column_widths[$fieldName] - 0.1)) : ""
			));
		}
		return new DataObjectSet($headings);
	}	
	
	/**
	 * Overridden to make label-fields in the per-page dropdown area show åäö correctly
	 * (by allowing html in the label title, otherwise åäö will be converted to html-entities)
	 */
	public function PerPageDropdown() {
		$map = array();
		foreach($this->per_page_map as $num) $map[$this->RelativeLink(array('per_page' => $num))] = $num;
		if($this->use_view_all)
			$map[$this->RelativeLink(array('per_page' => '9999'))] = _t('DataObjectManager.ALL','All');
		$value = !empty($this->per_page) ? $this->RelativeLink(array('per_page' => $this->per_page)) : null;
		return new FieldGroup(
			new LabelField('show', _t('DataObjectManager.PERPAGESHOW','Show').' ', null, true),
			new DropdownField('PerPage','',$map, $value),
			new LabelField('results', ' '._t('DataObjectManager.PERPAGERESULTS','results per page'), null, true)

		);
	}
}

class DialogDataObjectManager_Item extends DataObjectManager_Item {
	
	public function ViewOrEdit_i18n() {
	  if($res = $this->ViewOrEdit()) {
		  if ($this->item->hasMethod('getDOMTitle'))
		    return ($res == "edit") ? sprintf(_t('DialogDataObjectManager.EDITITEM','Edit %s'), $this->item->getDOMTitle()) : sprintf(_t('DialogDataObjectManager.VIEWITEM','View %s'), $this->item->getDOMTitle());
		  else
			return ($res == "edit") ? sprintf(_t('DialogDataObjectManager.EDITITEM','Edit %s'), $this->parent->SingleTitle()) : sprintf(_t('DialogDataObjectManager.VIEWITEM','View %s'), $this->parent->SingleTitle());
	  }
	  return null;
	}

	// Must override actions to allow wizard mode on duplicate
	public function Actions() {
		$actions = parent::Actions();
		if ($actions) {
			foreach ($actions as $action) {
				if (strstr($action->ActionClass, 'duplicate')) {
					if ($this->parent->getWizardMode() == true) 
						$action->ActionClass = $action->ActionClass . ' wizard-mode';
					
					//$action->Title = _t('DataObjectManager.DUPLICATE','Duplicate') . ' ' . $this->parent->SingleTitle();
				}
			}
		}
		return $actions;
	}	
	
}

class DialogDataObjectManager_ItemRequest extends DataObjectManager_ItemRequest {
	
	public function emulateIE7() {
		return DialogDataObjectManager::$emulateIE7_inPopup;
	}	
	
	function AddForm($childID = null) {
		$className = $this->ctf->sourceClass();
		$childData = new $className();
		
		$fields = $this->ctf->getFieldsFor($childData);
		$validator = $this->ctf->getValidatorFor($childData);

		$form = new $this->ctf->popupClass(
			$this,
			'AddForm',
			$fields,
			$validator,
			false,
			$childData,
			$this->ctf->getWizardMode()
		);

		$form->loadDataFrom($childData);
		
		return $form;
	}
	
	public function duplicate()
	{
		if(!$this->ctf->Can('duplicate'))
			return false;
		$this->methodName = "duplicate";
		
		echo $this->renderWith($this->ctf->templatePopup);
	}	
	
	function DuplicateForm() {
		$className = $this->ctf->sourceClass();
		$childData = $this->dataObj(); //new $className();
		
		$fields = $this->ctf->getFieldsFor($childData);
		$validator = $this->ctf->getValidatorFor($childData);

		$form = new $this->ctf->popupClass(
			$this,
			'DuplicateForm',
			$fields,
			$validator,
			false,
			$childData,
			$this->ctf->getWizardMode()
		);

		$form->loadDataFrom($childData);
		
		return $form;
	}

	/**
	 * Overridden to add a random string to form ids (because we can have many forms due to
	 * using jQuery dialogs), and to be able to use the same DetailForm function for both
	 * add- and edit-forms.
	 */
	function DetailForm($childID = null) {
		if (!$this->itemID) {
			$form = $this->AddForm($childID);
		}
		elseif ($this->methodName == 'duplicate') {
			$form = $this->DuplicateForm();
		}	
		else {
			$form = parent::DetailForm($childID);
		}
		
		return $form;
	}
	
	function saveComplexTableField($data, $form, $params) {
		// use addComplexTableField if the url contains AddForm, to be able to add items in nested DOM's
		if ($this->itemID == 0 || strstr($this->getRequest()->getURL(), 'AddForm')) {
			$this->addComplexTableField($data, $form, $params);
		}
		elseif (strstr($this->getRequest()->getURL(), 'DuplicateForm')) {
			$this->duplicateComplexTableField($data, $form, $params);
		}
		else {
			$this->updateComplexTableField($data, $form, $params);
		}
	}

	function addComplexTableField($data, $form, $params) {
		try {		
			$className = $this->ctf->sourceClass();
			$childData = new $className();
			$childData->write();
			$form->saveInto($childData);
			$childData->write();
			// Save the many many relationship if it's available
			if(isset($data['ctf']['manyManyRelation'])) {
				$parentRecord = DataObject::get_by_id($data['ctf']['parentClass'], (int) $data['ctf']['sourceID']);
				if ($parentRecord) {
					$relationName = $data['ctf']['manyManyRelation'];
					$componentSet = $parentRecord->getManyManyComponents($relationName);
					$componentSet->add($childData);
				}
			}
					
			//echo sprintf(_t('DataObjectManager.ADDEDNEW','Added new %s successfully'),$this->ctf->SingleTitle());
			$response['code'] = 'good';
			// Should we always close the popup after add, is that more logical compared to switching to editing mode directly?
			//if (isset($data['closeAfterAdd'])) 
			$response['closePopup'] = true;	
			$response['message'] = sprintf(_t('DataObjectManager.ADDEDNEW','Added new %s successfully'),$this->ctf->SingleTitle());
			echo json_encode($response);			
		}
		catch(ValidationException $e) {
			$response['code'] = 'bad';
			$response['message'] = $e->getResult()->message();
			echo json_encode($response);
		}
	}
	

	function duplicateComplexTableField($data, $form, $params) {
		try {		
			$className = $this->ctf->sourceClass();
			$childData = new $className();
			$childData->write();
			$form->saveInto($childData);
			$childData->write();
			// Save the many many relationship if it's available
			if(isset($data['ctf']['manyManyRelation'])) {
				$parentRecord = DataObject::get_by_id($data['ctf']['parentClass'], (int) $data['ctf']['sourceID']);
				if ($parentRecord) {
					$relationName = $data['ctf']['manyManyRelation'];
					$componentSet = $parentRecord->getManyManyComponents($relationName);
					$componentSet->add($childData);
				}
			}
		
			//echo sprintf(_t('DataObjectManager.DUPLICATED','Duplicated %s successfully'),$this->ctf->SingleTitle());
			$response['code'] = 'good';
			// Should we always close the popup after duplicate, is that more logical compared to switching to editing mode directly?			
			//if (isset($data['closeAfterDuplicate'])) 
			$response['closePopup'] = true;
			$response['message'] = sprintf(_t('DataObjectManager.DUPLICATED','Duplicated %s successfully'),$this->ctf->SingleTitle());
			echo json_encode($response);
		}
		catch(ValidationException $e) {
			$response['code'] = 'bad';
			$response['message'] = $e->getResult()->message();
			echo json_encode($response);
		}		
	}	
	
	function updateComplexTableField($data, $form, $request) {
		try {
			$dataObject = $this->dataObj();
			$form->saveInto($dataObject);
			$dataObject->write();
			// Save the many many relationship if it's available
			if(isset($data['ctf']['manyManyRelation'])) {
				$parentRecord = DataObject::get_by_id($data['ctf']['parentClass'], (int) $data['ctf']['sourceID']);
				$relationName = $data['ctf']['manyManyRelation'];
				$componentSet = $parentRecord->getManyManyComponents($relationName);
				$componentSet->add($dataObject);
			}
		
			//echo sprintf(_t('DataObjectManager.SAVED','Saved %s successfully'),$this->ctf->SingleTitle());
			$response['code'] = 'good';
			if (isset($data['closeAfterSave'])) 
				$response['closePopup'] = true;
			$response['message'] = sprintf(_t('DataObjectManager.SAVED','Saved %s successfully'),$this->ctf->SingleTitle());
			echo json_encode($response);			
		}
		catch(ValidationException $e) {
			$response['code'] = 'bad';
			$response['message'] = $e->getResult()->message();
			echo json_encode($response);
		}
	}
	
	function Link() {
    	return Controller::join_links($this->ctf->BaseLink() , 'item/' . $this->itemID . '/');	
		
	}	
}

class DialogDataObjectManager_Popup extends DataObjectManager_Popup {
	
	function __construct($controller, $name, $fields, $validator, $readonly, $dataObject, $wizardMode = false) {
		parent::__construct($controller, $name, $fields, $validator, $readonly, $dataObject);
		Requirements::javascript('sapphire/thirdparty/jquery/jquery.js');
		Requirements::javascript('dialog_dataobject_manager/javascript/jquery-ui-1.8.6.custom.min.js');
		Requirements::javascript('sapphire/thirdparty/jquery-form/jquery.form.js');
		Requirements::javascript('sapphire/thirdparty/jquery-metadata/jquery.metadata.js');
		Requirements::javascript('dialog_dataobject_manager/javascript/dialog_dataobject_manager_popup.js');
		Requirements::block('dataobject_manager/javascript/dataobjectmanager_popup.js');
		
		Requirements::css('dialog_dataobject_manager/css/smoothness/jquery-ui-1.8.6.custom.css');
		Requirements::css('dialog_dataobject_manager/css/DialogDataObjectManager.css');
		Requirements::css('dialog_dataobject_manager/css/DialogDataObjectManager_extras.css');
		
		Requirements::block('http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.1/themes/smoothness/jquery-ui.css');
		Requirements::block('http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.1/jquery-ui.min.js');
		Requirements::block(THIRDPARTY_DIR.'/jquery-ui-themes/smoothness/jquery-ui-1.8rc3.custom.css');	
		
		Requirements::insertHeadTags('<meta http-equiv="Content-language" content="' . i18n::get_locale() . '" />');		
		
		if ($wizardMode) {
			Requirements::css('dialog_dataobject_manager/css/valid8.css');
			Requirements::javascript('dialog_dataobject_manager/javascript/jquery.valid8.min.js');
			Requirements::javascript('dialog_dataobject_manager/javascript/jquery.forceredraw-1.0.3.js');
			
			if ($dataObject->hasMethod('getWizardValidationRules')) {
				$dataObject->getWizardValidationRules();
			}

			Requirements::clear('dialog_dataobject_manager/javascript/dialog_dataobject_manager_popup.js');
			Requirements::javascript('dialog_dataobject_manager/javascript/dialog_dataobject_manager_wizardpopup.js');
		}
		
		if($this->getNestedDOMs()) {						
			Requirements::javascript('sapphire/javascript/i18n.js');
			Requirements::add_i18n_javascript('dialog_dataobject_manager/javascript/lang');
			Requirements::javascript('dialog_dataobject_manager/javascript/dialog_dataobject_manager.js');
			
			// blockUI is used to overlay a loading message when data is loading
			Requirements::javascript('dialog_dataobject_manager/javascript/jquery.blockUI.js');			
  		}
  		
		$this->clearMessage();
	}
	
}

?>